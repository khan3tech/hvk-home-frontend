import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailPage } from "@/components/services/service-detail-page";
import { SERVICES } from "@/lib/constants";
import { SERVICE_DETAILS, getServiceDetail } from "@/lib/service-details";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_DETAILS.map((detail) => ({ slug: detail.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = getServiceDetail(slug);
  const service = SERVICES.find((s) => s.id === slug);
  if (!detail || !service) return {};
  return {
    title: `${service.title} | HVK Tech Online Examination`,
    description: detail.metaDescription,
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const detail = getServiceDetail(slug);
  if (!detail) notFound();
  return <ServiceDetailPage detail={detail} />;
}
