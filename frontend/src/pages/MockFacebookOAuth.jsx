import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckSquare, Square, Info, ChevronRight, Lock } from 'lucide-react';

const MockFacebookOAuth = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    public_profile: true,
    pages_show_list: true,
    pages_read_engagement: true,
    pages_manage_posts: true,
  });

  const [selectedPages, setSelectedPages] = useState({
    kaiyo_shop: true,
    dist_channel: false,
  });

  const handleTogglePerm = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTogglePage = (key) => {
    setSelectedPages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCancel = () => {
    navigate('/poster-dashboard');
  };

  const handleContinue = () => {
    // Redirect back to dashboard with mock oauth code
    navigate('/poster-dashboard?code=mock_sandbox_code&state=facebook');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      color: '#1c1e21',
      fontFamily: 'SFProText-Regular, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Container simulating Facebook Modal Dialog */}
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '580px',
        borderRadius: '12px',
        boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        border: '1px solid #dddfe2'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#1877f2',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '-1px'
          }}>facebook</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '13px' }}>
            <Lock size={14} />
            <span>Secure Connection</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* App Info Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <span style={{ color: '#38bdf8', fontSize: '28px', fontWeight: 'bold' }}>M</span>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1c1e21' }}>MarketingHub Integration</h2>
              <p style={{ fontSize: '13px', color: '#65676b', margin: '4px 0 0 0' }}>Request for permissions & Page access</p>
            </div>
          </div>

          <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#050505', marginBottom: '20px' }}>
            MarketingHub is requesting access to link your Facebook account. Select the permissions you want to grant to this application:
          </p>

          {/* Permissions section */}
          <div style={{ border: '1px solid #e4e6eb', borderRadius: '8px', padding: '16px', marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', color: '#65676b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Requested Permissions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Permission Item: public_profile */}
              <div 
                onClick={() => handleTogglePerm('public_profile')}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
              >
                {permissions.public_profile ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Public Profile (required)</div>
                  <div style={{ fontSize: '12px', color: '#65676b' }}>Name, profile picture, and username.</div>
                </div>
              </div>

              {/* Permission Item: pages_show_list */}
              <div 
                onClick={() => handleTogglePerm('pages_show_list')}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
              >
                {permissions.pages_show_list ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Show List of Pages (pages_show_list)</div>
                  <div style={{ fontSize: '12px', color: '#65676b' }}>Enables MarketingHub to display a list of Pages you manage.</div>
                </div>
              </div>

              {/* Permission Item: pages_read_engagement */}
              <div 
                onClick={() => handleTogglePerm('pages_read_engagement')}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
              >
                {permissions.pages_read_engagement ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>Read Page Posts & Analytics (pages_read_engagement)</div>
                  <div style={{ fontSize: '12px', color: '#65676b' }}>Required to read Page feed posts, view comments, and fetch Likes, Comments, and Shares.</div>
                </div>
              </div>

              {/* Permission Item: pages_manage_posts */}
              <div 
                onClick={() => handleTogglePerm('pages_manage_posts')}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
              >
                {permissions.pages_manage_posts ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Create and Manage Posts (pages_manage_posts)</div>
                  <div style={{ fontSize: '12px', color: '#65676b' }}>Allows the app to automatically post marketing content, photos, and campaigns.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Selection section */}
          <div style={{ border: '1px solid #e4e6eb', borderRadius: '8px', padding: '16px', marginBottom: '24px', backgroundColor: '#f8f9fa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', color: '#65676b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Pages to Link
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                onClick={() => handleTogglePage('kaiyo_shop')}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
              >
                {selectedPages.kaiyo_shop ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>K</div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Kaiyo Vietnam Shop (Sandbox Page)</span>
                </div>
              </div>

              <div 
                onClick={() => handleTogglePage('dist_channel')}
                style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
              >
                {selectedPages.dist_channel ? <CheckSquare size={20} color="#1877f2" /> : <Square size={20} color="#65676b" />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#65676b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>V</div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Vietnam Distribution Channel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#65676b', fontSize: '11px', lineHeight: '1.4', marginBottom: '24px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              By granting these permissions, MarketingHub will be able to access your data according to their Terms of Service and Privacy Policy. The developer of MarketingHub will not have access to your personal login password.
            </span>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #e4e6eb',
            paddingTop: '20px'
          }}>
            <button 
              onClick={handleCancel}
              style={{
                backgroundColor: '#e4e6eb',
                color: '#4b4f56',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d8dadf'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e4e6eb'}
            >
              Cancel
            </button>
            <button 
              onClick={handleContinue}
              style={{
                backgroundColor: '#1877f2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#166fe5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1877f2'}
            >
              Continue as Admin <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div style={{
        marginTop: '24px',
        color: '#8a8d91',
        fontSize: '12px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div>Meta © 2026 • English (US) • Privacy • Terms</div>
      </div>
    </div>
  );
};

export default MockFacebookOAuth;
