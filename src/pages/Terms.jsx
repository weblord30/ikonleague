import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const nav = useNavigate()
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
      <button onClick={() => nav(-1)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--sub)', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 32 }}>← Back</button>
      <h2 style={{ fontSize: 36, marginBottom: 4 }}>Terms & Conditions</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 40 }}>ikonLeague Season 1 · Last updated August 2026</p>

      {[
        ["1. Eligibility", "ikonLeague Season 1 is open to all players with an active eFootball mobile account. Participation is limited to one registration per person. Any player found to have created duplicate accounts will be permanently disqualified without refund. By registering, you confirm that you are the sole owner of the eFootball account you have provided and that all information submitted is accurate."],
        ["2. Entry Fee & Payment", "The entry fee for Season 1 is two thousand naira (₦2,000). Payment is to be made via Moniepoint bank transfer to Mustapha Olabode Sulaimon, account number 7025204373. After completing your transfer, you are required to upload a clear screenshot of your payment receipt within the registration flow. Your registration will remain in a pending state until an admin manually verifies your payment. Please note that all entry fees are strictly non-refundable once your payment has been verified and your registration is confirmed."],
        ["3. Registration & Spot Allocation", "Registration for Season 1 is open on a first-come, first-served basis and is capped at a maximum of twenty (20) players. Submitting the registration form and uploading a payment screenshot does not guarantee your spot. Your place in the league is only confirmed once an admin has reviewed and approved your payment. ikonLeague admin reserves the right to close registration at any time if the level of interest is deemed insufficient to run a competitive season, in which case all verified payments will be refunded in full."],
        ["4. Fixtures & Match Scheduling", "ikonLeague operates on a full round-robin format, meaning every registered player will face every other player exactly once during the season. All fixtures are published on the ikonLeague app and represent the official schedule for the season. Each player is personally responsible for contacting their opponent ahead of their scheduled matchday to agree on a suitable time to play. Matches that are not completed within the allotted matchday window will be recorded as a 0 — 0 draw by default, unless it can be clearly demonstrated that one party was unresponsive or unavailable, in which case admin may award a walkover at their discretion."],
        ["5. Results & Reporting", "After every match, both players are required to submit a screenshot of the final scoreline to the ikonLeague admin via the WhatsApp group. Results will be officially recorded on the ikonLeague app by the admin. In the event of a discrepancy between the scores submitted by the two players, the matter will be reviewed by admin, whose decision will be final and binding. Attempting to falsify or manipulate a result will result in immediate disqualification."],
        ["6. Code of Conduct", "All participants are expected to conduct themselves with respect and sportsmanship at all times, both within the ikonLeague WhatsApp group and during matches. Any form of harassment, verbal abuse, hate speech, threats, or unsportsmanlike behaviour — whether in the group or directed at another player privately — will result in immediate disqualification from the league without refund. ikonLeague is a competitive but respectful community and we expect every participant to uphold that standard."],
        ["7. Prize Pool & Payouts", "The prize pool for Season 1 consists of one hundred percent (100%) of all verified entry fees collected. Provided the league reaches twenty (20) players, prizes will be distributed as follows: first place receives forty percent (40%) of the total pool, second place receives thirty percent (30%), third place receives twenty percent (20%), and fourth place receives ten percent (10%). If the final number of registered players is fewer than twenty, ikonLeague admin reserves the right to adjust the prize tier structure accordingly and will communicate any changes transparently to all participants. All prizes will be paid out via bank transfer within forty-eight (48) hours of the conclusion of the final matchday. Winners are responsible for providing accurate bank account details for payment."],
        ["8. Admin Rights & Decisions", "ikonLeague admin reserves the right to disqualify any player found to be cheating, abusing in-game exploits, acting in bad faith, or violating any of the terms set out in this document. Admin also reserves the right to modify match schedules, adjust prize structures with notice, or make any other decisions necessary for the smooth running of the league. All admin decisions are final. By participating, you agree to accept the outcome of any admin ruling without dispute."],
        ["9. Agreement", "By completing the registration form, uploading your payment screenshot, and ticking the agreement checkbox, you confirm that you have read, understood, and agreed to all of the terms and conditions set out in this document in their entirety. These terms are binding for the full duration of ikonLeague Season 1."],
      ].map(([title, body]) => (
        <div key={title} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, color: 'var(--green)', marginBottom: 10, fontFamily: 'Bebas Neue', letterSpacing: '.04em' }}>{title}</h3>
          <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.8 }}>{body}</p>
        </div>
      ))}

      {/* Summary */}
      <div style={{ background: 'rgba(0,200,150,.07)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 16, padding: '24px 28px', marginTop: 48 }}>
        <h3 style={{ fontSize: 20, marginBottom: 16, color: 'var(--text)' }}>Key Things to Know</h3>
        {[
          'Entry fee is ₦2,000 — non-refundable once your payment is verified',
          'Your spot is not confirmed until admin manually approves your payment screenshot',
          'Every player faces every other player — full round-robin format',
          'Both players must submit a result screenshot to admin after every match',
          'Bad behaviour means instant disqualification with no refund',
          'Prizes are paid within 48 hours of the final matchday via bank transfer',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ color: 'var(--green)', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}