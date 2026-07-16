import { DashboardLayout } from "@/components/DashboardLayout";

type DashboardRouteLoadingProps = {
  label?: string;
  breadcrumb?: string;
};

export function DashboardRouteLoading({
  label = "Loading workspace",
  breadcrumb = "Dashboard",
}: DashboardRouteLoadingProps) {
  return (
    <DashboardLayout breadcrumbs={[{ label: breadcrumb }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <section className="mx-auto max-w-6xl" aria-busy="true" aria-label={label}>
          <div className="animate-pulse motion-reduce:animate-none">
            <div className="h-3 w-32 rounded-[3px] bg-[#dfe3da]" />
            <div className="mt-4 h-10 w-full max-w-md rounded-[3px] bg-[#e5e8e1]" />
            <div className="mt-3 h-5 w-full max-w-2xl rounded-[3px] bg-[#eceee9]" />
            <div className="mt-8 h-16 rounded-[4px] border border-[#e0e4dc] bg-white" />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="min-h-[220px] rounded-[4px] border border-[#e0e4dc] bg-white" />
              <div className="min-h-[220px] rounded-[4px] border border-[#e0e4dc] bg-white" />
              <div className="min-h-[220px] rounded-[4px] border border-[#e0e4dc] bg-white" />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
