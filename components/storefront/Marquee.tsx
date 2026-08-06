export default function Marquee() {
  const text =
    "FREE SHIPPING OVER $150 \u2726 NEW CATALOGUE — FIELD SERIES 04 \u2726 RESTOCK: DERBY BOOT \u2726 ARCHIVE ACCESS OPEN \u2726 ";
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        <span className="marquee-text">{text.repeat(2)}</span>
        <span className="marquee-text">{text.repeat(2)}</span>
      </div>
    </div>
  );
}
