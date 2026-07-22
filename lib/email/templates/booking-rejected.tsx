import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import ar from "@/lib/i18n/dictionaries/ar.json";
import en from "@/lib/i18n/dictionaries/en.json";

export interface BookingRejectedEmailProps {
  locale: "ar" | "en";
  patientName: string;
  hospitalName: string;
  reason?: string;
}

export function BookingRejectedEmail({ locale, patientName, hospitalName, reason }: BookingRejectedEmailProps) {
  const t = (locale === "ar" ? ar : en).email.rejected;
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

          {reason ? (
            <>
              <Hr style={{ borderColor: "#e5e6ea", margin: "20px 0" }} />
              <Text style={{ fontSize: 14, color: "#003262" }}>
                <span style={{ color: "#64748b" }}>{t.reason}: </span>
                <span style={{ fontWeight: 700 }}>{reason}</span>
              </Text>
            </>
          ) : null}

          <Hr style={{ borderColor: "#e5e6ea", margin: "20px 0" }} />
          <Text style={{ color: "#64748b", fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BookingRejectedEmail;
