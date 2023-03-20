export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  approved
}) {
  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div> Arbiter </div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value </div>
          <div> {value} ETH</div>
        </li>
        <div
          className={approved ? "complete" : "button"}
          id={address}
          onClick={(e) => {
            e.preventDefault();

            handleApprove();
          }}
        >
          {approved ? "✓ It's been approved!" : "Approve"}
        </div>
      </ul>
    </div>
  );
}
