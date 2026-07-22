import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import ar from "@/lib/i18n/dictionaries/ar.json";
import en from "@/lib/i18n/dictionaries/en.json";

export interface BookingConfirmedEmailProps {
  locale: "ar" | "en";
  patientName: string;
  doctorName: string;
  departmentName: string;
  dateLabel: string;
  timeLabel: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
}

export function BookingConfirmedEmail({
  locale,
  patientName,
  doctorName,
  departmentName,
  dateLabel,
  timeLabel,
  hospitalName,
  hospitalAddress,
  hospitalPhone,
}: BookingConfirmedEmailProps) {
  const t = (locale === "ar" ? ar : en).email.confirmed;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <Html dir={dir} lang={locale}>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={{ backgroundColor: "#e5e6ea", fontFamily: "Arial, sans-serif", padding: "24px 0" }}>
        <Container
          style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 32, maxWidth: 480 }}
          dir={dir}
        >
          <Text style={{ color: "#bc9b6a", fontWeight: 700, fontSize: 14, margin: 0 }}>{hospitalName}</Text>
          <Heading style={{ color: "#003262", fontSize: 22, margin: "8px 0 16px" }}>{t.heading}</Heading>
          <Text style={{ color: "#003262", fontSize: 15 }}>{t.greeting.replace("{name}", patientName)}</Text>
          <Text style={{ color: "#334155", fontSize: 14 }}>{t.body}</Text>

          <Hr style={{ borderColor: "#e5e6ea", margin: "20px 0" }} />

          <Row label={t.doctor} value={doctorName} />
          <Row label={t.department} value={departmentName} />
          <Row label={t.date} value={dateLabel} />
          <Row label={t.time} value={timeLabel} />
          {hospitalAddress ? <Row label={t.address} value={hospitalAddress} /> : null}
          {hospitalPhone ? <Row label={t.phone} value={hospitalPhone} /> : null}

          <Hr style={{ borderColor: "#e5e6ea", margin: "20px 0" }} />
          <Text style={{ color: "#64748b", fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: 14, margin: "4px 0", color: "#003262" }}>
      <span style={{ color: "#64748b" }}>{label}: </span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </Text>
  );
}

export default BookingConfirmedEmail;
