import type { ModuleKey } from "@/App";
import Sidebar from "./Sidebar";

interface LayoutProps {
  activeModule: ModuleKey;
  onModuleChange: (module: ModuleKey) => void;
  children: React.ReactNode;
}

export default function Layout({
  activeModule,
  onModuleChange,
  children,
}: LayoutProps): JSX.Element {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      <Sidebar activeModule={activeModule} onModuleChange={onModuleChange} />
      <main className="flex-1 overflow-auto bg-surface-0">{children}</main>
    </div>
  );
}
