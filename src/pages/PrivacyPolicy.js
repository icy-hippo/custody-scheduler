import { useNavigate } from 'react-router-dom';

function PrivacyPolicy() {
  const navigate = useNavigate();

  const section = (title, children) => (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '12px', borderBottom: '2px solid #667eea', paddingBottom: '8px' }}>
        {title}
      </h2>
      {children}
    </div>
  );

  const p = (text) => (
    <p style={{ color: '#555', lineHeight: '1.8', margin: '0 0 12px 0' }}>{text}</p>
  );

  const li = (text) => (
    <li style={{ color: '#555', lineHeight: '1.8', marginBottom: '6px' }}>{text}</li>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9ff', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Privacy Policy</h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '14px' }}>HarmonyHub — Last updated June 28, 2025</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        {section('Overview', <>
          {p('HarmonyHub ("we", "our", or "the app") is a shared custody scheduling app designed to help divorced or separated families coordinate schedules and stay connected with their children. We are committed to protecting the privacy of all users, especially children.')}
          {p('This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.')}
        </>)}

        {section('Information We Collect', <>
          {p('We collect the following types of information when you use HarmonyHub:')}
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            {li('Account information: email address and display name provided during sign-up.')}
            {li('Family data: custody schedule patterns, transition dates, and parent/child role.')}
            {li('Events: titles, dates, times, locations, and categories of calendar events you create.')}
            {li('Messages: in-app messages exchanged between co-parents within a linked family.')}
            {li('Expenses: expense amounts, descriptions, and categories you log.')}
            {li('Routine cards: daily routine items you create for your child.')}
            {li('Device information: platform type (Android/iOS/web) used to deliver local notifications.')}
          </ul>
          {p('We do not collect location data, biometric data, or any sensitive personal information beyond what is listed above.')}
        </>)}

        {section('How We Use Your Information', <>
          {p('Your information is used solely to provide and improve the HarmonyHub service:')}
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            {li('To display your family\'s schedule, events, and custody calendar.')}
            {li('To enable co-parents to share updates and coordinate in real time.')}
            {li('To send local device notifications about upcoming events and custody transitions.')}
            {li('To allow your child to view a simplified, age-appropriate version of the schedule.')}
          </ul>
          {p('We do not sell, rent, or share your personal information with third parties for marketing purposes.')}
        </>)}

        {section('Children\'s Privacy', <>
          {p('HarmonyHub is designed to be used by children under parental supervision. Child accounts are created by linking to a parent\'s family using a family code shared by the parent.')}
          {p('We collect minimal information from child accounts (email and display name only) and do not display advertising to child users. Parents can remove a child account\'s access at any time by unlinking the family.')}
          {p('If you believe a child has provided information without parental consent, please contact us immediately at the email below.')}
        </>)}

        {section('Data Storage and Security', <>
          {p('All data is stored securely using Google Firebase (Firestore and Firebase Authentication), which provides industry-standard encryption in transit and at rest.')}
          {p('Access to family data is restricted by security rules — users can only read and write data belonging to their own family. No user can access another family\'s data.')}
          {p('We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time.')}
        </>)}

        {section('Third-Party Services', <>
          {p('HarmonyHub uses the following third-party services:')}
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            {li('Google Firebase — authentication and database (Google Privacy Policy applies).')}
            {li('Capacitor — mobile app framework for Android (no data collection).')}
          </ul>
          {p('We do not use third-party analytics, advertising networks, or tracking tools.')}
        </>)}

        {section('Your Rights', <>
          {p('You have the right to:')}
          <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
            {li('Access the personal data we hold about you.')}
            {li('Request correction of inaccurate data.')}
            {li('Request deletion of your account and all associated data.')}
            {li('Withdraw consent at any time by deleting your account.')}
          </ul>
          {p('To exercise any of these rights, contact us at the email address below.')}
        </>)}

        {section('Changes to This Policy', <>
          {p('We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the app after changes are posted constitutes acceptance of the updated policy.')}
        </>)}

        {section('Contact Us', <>
          {p('If you have questions or concerns about this Privacy Policy or your data, please contact us:')}
          <div style={{
            background: '#f0f4ff',
            border: '2px solid #667eea',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '8px'
          }}>
            <p style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>HarmonyHub</p>
            <p style={{ margin: '4px 0 0 0', color: '#667eea' }}>harmonyhubapp@gmail.com</p>
          </div>
        </>)}

        <div style={{
          marginTop: '40px',
          padding: '16px',
          background: '#fff',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          © 2025 HarmonyHub. Built with care for families.
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
