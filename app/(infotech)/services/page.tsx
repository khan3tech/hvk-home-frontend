import { redirect } from "next/navigation";

// There is no separate services index: the list lives on the registration page.
export default function ServicesIndex() {
  redirect("/registration#services");
}
