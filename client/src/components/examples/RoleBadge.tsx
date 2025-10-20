import { RoleBadge } from "../RoleBadge";

export default function RoleBadgeExample() {
  return (
    <div className="flex gap-4 p-8 flex-wrap">
      <RoleBadge role="Admin" />
      <RoleBadge role="Facilitator" />
      <RoleBadge role="Contributor" />
      <RoleBadge role="Viewer" />
    </div>
  );
}
