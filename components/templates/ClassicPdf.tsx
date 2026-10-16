import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { ResumeSection } from "@/types/resume";

// react-pdf ships its own layout engine (not a browser), so styles are a
// StyleSheet object rather than CSS/Tailwind classes.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#16213E" },
  name: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  headline: { fontSize: 11, marginBottom: 6 },
  contactRow: { fontSize: 9, color: "#3F4E63", marginBottom: 10 },
  divider: { borderBottomWidth: 2, borderBottomColor: "#0E7C7B", marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#0E7C7B",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E2DA",
    paddingBottom: 3,
    marginBottom: 6,
  },
  section: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  bold: { fontWeight: 700 },
  muted: { color: "#3F4E63" },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bulletDot: { width: 10 },
  entryBlock: { marginBottom: 6 },
});

export default function ClassicPdf({
  sections,
  accentColor,
}: {
  sections: ResumeSection[];
  accentColor?: string;
}) {
  const visible = [...sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const contact = visible.find((s) => s.type === "contact")?.content as any;
  const headline = visible.find((s) => s.type === "headline")?.content as any;
  const rest = visible.filter((s) => s.type !== "contact" && s.type !== "headline");
  const accent = accentColor || "#0E7C7B";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{contact?.fullName || "Your Name"}</Text>
        {headline?.text ? <Text style={[styles.headline, { color: accent }]}>{headline.text}</Text> : null}
        <Text style={styles.contactRow}>
          {[contact?.email, contact?.phone, contact?.location].filter(Boolean).join("   •   ")}
        </Text>
        <View style={[styles.divider, { borderBottomColor: accent }]} />

        {rest.map((section) => (
          <View key={section.id} style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: accent }]}>{section.title}</Text>
            <SectionPdfBody section={section} />
          </View>
        ))}
      </Page>
    </Document>
  );
}

function SectionPdfBody({ section }: { section: ResumeSection }) {
  const c: any = section.content;

  if (section.type === "summary") return <Text>{c.text}</Text>;

  if (section.type === "experience" || section.type === "internships") {
    return (
      <>
        {(c.entries || []).map((e: any) => (
          <View key={e.id} style={styles.entryBlock}>
            <View style={styles.row}>
              <Text style={styles.bold}>{e.role} — {e.company}</Text>
              <Text style={styles.muted}>{e.startDate} – {e.endDate}</Text>
            </View>
            {(e.bullets || []).map((b: string, i: number) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </>
    );
  }

  if (section.type === "education") {
    return (
      <>
        {(c.entries || []).map((e: any) => (
          <View key={e.id} style={styles.row}>
            <Text>{e.degree} in {e.fieldOfStudy} — {e.institution}</Text>
            <Text style={styles.muted}>{e.startDate} – {e.endDate}</Text>
          </View>
        ))}
      </>
    );
  }

  if (section.type === "projects") {
    return (
      <>
        {(c.entries || []).map((e: any) => (
          <View key={e.id} style={styles.entryBlock}>
            <Text style={styles.bold}>
              {e.name}{e.techStack?.length ? ` — ${e.techStack.join(", ")}` : ""}
            </Text>
            {(e.bullets || []).map((b: string, i: number) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </>
    );
  }

  if (["technicalSkills", "softSkills", "interests"].includes(section.type)) {
    return <Text>{(c.skills || []).join("   •   ")}</Text>;
  }

  if (section.type === "certifications") {
    return (
      <>
        {(c.entries || []).map((e: any) => (
          <Text key={e.id}>{e.name} — {e.issuer} ({e.date})</Text>
        ))}
      </>
    );
  }

  if (["achievements", "awards", "publications", "research", "volunteer", "custom"].includes(section.type)) {
    return (
      <>
        {(c.entries || []).map((e: any) => (
          <View key={e.id} style={{ marginBottom: 3 }}>
            <Text>
              <Text style={styles.bold}>{e.title}</Text>
              {e.subtitle ? ` — ${e.subtitle}` : ""} {e.date ? `(${e.date})` : ""}
            </Text>
            {e.description ? <Text style={styles.muted}>{e.description}</Text> : null}
          </View>
        ))}
      </>
    );
  }

  if (section.type === "languages") {
    return <Text>{(c.entries || []).map((e: any) => `${e.language} (${e.proficiency})`).join("   •   ")}</Text>;
  }

  if (section.type === "links") {
    return <Text>{[c.linkedin, c.github, c.portfolio, c.website].filter(Boolean).join("   ")}</Text>;
  }

  return null;
}
