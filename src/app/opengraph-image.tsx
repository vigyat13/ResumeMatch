import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ResumeMatch — AI-powered resume builder and job matching'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#080808',
          color: '#f5f0e8',
          padding: 64,
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 20%, rgba(47,214,154,0.28), transparent 30%), radial-gradient(circle at 82% 80%, rgba(245,240,232,0.12), transparent 28%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.16,
            backgroundImage:
              'linear-gradient(90deg, rgba(245,240,232,0.12) 1px, transparent 1px), linear-gradient(rgba(245,240,232,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: '#f5f0e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: '8px solid #080808',
                  borderTop: '0',
                  borderRight: '0',
                  transform: 'rotate(-45deg)',
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ display: 'flex', fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>
              <span>Resume</span>
              <span style={{ color: '#2fd69a' }}>Match</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 860 }}>
            <div style={{ fontSize: 82, lineHeight: 0.95, fontWeight: 900, letterSpacing: -4 }}>
              Build resumes that match the job.
            </div>
            <div style={{ marginTop: 26, fontSize: 28, lineHeight: 1.35, color: 'rgba(245,240,232,0.68)' }}>
              ATS-ready templates, AI feedback, job matching, and the path toward agent-assisted applications.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Resume Builder', 'ATS Audit', 'Job Matching'].map(item => (
                <div
                  key={item}
                  style={{
                    border: '1px solid rgba(245,240,232,0.18)',
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 20,
                    color: 'rgba(245,240,232,0.72)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 22, color: '#2fd69a', fontWeight: 800 }}>resumematch.live</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
