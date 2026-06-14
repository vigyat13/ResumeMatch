/**
 * POST /api/v1/resumes/upload
 *
 * Accepts a multipart/form-data file upload (PDF or DOCX, max 10MB).
 * Flow:
 *  1. Validate auth
 *  2. Validate file (type + size)
 *  3. Upload to Supabase Storage
 *  4. Insert metadata row in DB (status: 'pending')
 *  5. Parse resume immediately, then update the DB record
 *  6. Return 201 with resume data
 *
 * Why parse before returning?
 * Vercel/serverless can freeze execution after the response. If parsing is
 * fire-and-forget, records can remain pending or failed. We keep the UI in an
 * "extracting" state while this request completes so the DB is reliable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResume }  from '@/lib/resume/parser'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ALLOWED_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
])

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Validate file type
    const fileType = ALLOWED_TYPES.get(file.type)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 10MB.' },
        { status: 413 }
      )
    }

    // Convert file to buffer for storage + parsing
    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    // Generate storage path: resumes/{user_id}/{timestamp}_{filename}
    // Timestamp prefix prevents collisions on same-name files
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath  = `${user.id}/${Date.now()}_${safeFileName}`

    // Upload to Supabase Storage (S3-compatible)
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error('[Resume Upload] Storage error:', storageError)
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
    }

    // Create a signed URL valid for 7 days
    // Signed URLs let the user download their file without it being public
    const { data: signedUrlData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    const fileUrl = signedUrlData?.signedUrl ?? ''

    // Insert the resume record with status 'pending' — parsing happens async below
    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id:        user.id,
        file_name:      file.name,
        file_url:       fileUrl,
        file_type:      fileType,
        file_size:      file.size,
        storage_path:   storagePath,
        parsing_status: 'pending',
      })
      .select()
      .single()

    if (dbError || !resume) {
      console.error('[Resume Upload] DB error:', dbError)
      // Clean up storage if DB insert fails
      await supabase.storage.from('resumes').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save resume.' }, { status: 500 })
    }

    const { text, skills, error } = await parseResume(buffer, fileType as 'pdf' | 'docx')
    const parsingStatus = error ? 'failed' : 'completed'

    const { error: parseUpdateError } = await supabase
      .from('resumes')
      .update({
        parsed_text:       text,
        extracted_skills:  skills,
        parsing_status:    parsingStatus,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', resume.id)

    if (parseUpdateError) {
      console.error('[Resume Upload] Parse update error:', parseUpdateError)
    }

    return NextResponse.json(
      {
        data: {
          resume_id:      resume.id,
          file_name:      resume.file_name,
          file_url:       resume.file_url,
          file_type:      resume.file_type,
          file_size:      resume.file_size,
          created_at:     resume.created_at,
          extracted_skills: skills,
          parsing_status: parsingStatus,
          parse_error: error ?? null,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Resume Upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
