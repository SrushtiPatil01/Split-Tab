interface Props {
  members: string[];
}

export default function MemberList({ members }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {members.map((m) => (
        <span key={m} className="badge badge-member">
          {m}
        </span>
      ))}
    </div>
  );
}