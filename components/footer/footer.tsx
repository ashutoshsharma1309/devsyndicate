import { getContactInfo, getHomepage, getTeam } from "@/lib/cms";
import { FooterView, type FooterData } from "./footer-view";

/** Site footer, filled from published content (tagline, contact details, team). */
export async function Footer() {
  const [home, contact, team] = await Promise.all([getHomepage(), getContactInfo(), getTeam()]);
  const data: FooterData = {
    tagline: home.footer.tagline,
    email: contact.email,
    primaryContact: { name: contact.primaryContact.name, phone: contact.primaryContact.phone },
    companyPhone: contact.showCompanyPhone ? contact.phone : null,
    location: contact.location,
    team: team.members,
  };
  return <FooterView data={data} />;
}
