import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const emptyProperty = {
  name: "",
  type: "apartamento",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  tourist_registration_number: "",
  police_establishment_code: "",
};

const emptyBooking = {
  property_id: "",
  booking_reference: "",
  platform: "Directa",
  check_in: "",
  check_out: "",
  guest_count: 1,
  notes: "",
};

const sections = [
  { id: "inicio", icon: "🏠", label: "Inicio" },
  { id: "alojamientos", icon: "🏨", label: "Alojamientos" },
  { id: "reservas", icon: "📅", label: "Reservas" },
  { id: "huespedes", icon: "👥", label: "Huéspedes" },
  { id: "documentos", icon: "📄", label: "Documentos" },
  { id: "enlaces", icon: "📨", label: "Enlaces enviados" },
  { id: "equipo", icon: "🏢", label: "Equipo y empresa" },
  { id: "ajustes", icon: "⚙️", label: "Ajustes" },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("inicio");
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  const [properties, setProperties] = useState([]);
  const [newProperty, setNewProperty] = useState(emptyProperty);
  const [propertyMessage, setPropertyMessage] = useState("");

  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState(emptyBooking);
  const [bookingMessage, setBookingMessage] = useState("");
  const [lastBookingLink, setLastBookingLink] = useState("");

  const [editingCompany, setEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState([]);
  const [inviteMessage, setInviteMessage] = useState("");

  const pageTitle = useMemo(() => {
    return sections.find((section) => section.id === activeSection)?.label || "Dashboard";
  }, [activeSection]);

  useEffect(() => {
    initDashboard();
  }, []);

  async function initDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1);

    if (orgError) {
      console.error("Error cargando empresa:", orgError);
      setLoading(false);
      return;
    }

    let activeOrg = orgs?.[0];

    if (!activeOrg) {
      const { data: createdOrg, error: createOrgError } = await supabase
        .from("organizations")
        .insert({ name: "Mi empresa", owner_id: user.id })
        .select()
        .single();

      if (createOrgError) {
        console.error("Error creando empresa:", createOrgError);
        setLoading(false);
        return;
      }

      await supabase.from("organization_members").insert({
        organization_id: createdOrg.id,
        user_id: user.id,
        role: "owner",
      });

      activeOrg = createdOrg;
    }

    setOrganization(activeOrg);
    setCompanyName(activeOrg.name);

    await Promise.all([
      loadProperties(activeOrg.id),
      loadBookings(activeOrg.id),
      loadInvites(activeOrg.id),
    ]);

    setLoading(false);
  }

  async function loadProperties(organizationId) {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando alojamientos:", error);
      return;
    }

    setProperties(data || []);
  }

  async function loadBookings(organizationId) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        properties (
          name,
          city
        )
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando reservas:", error);
      return;
    }

    setBookings(data || []);
  }

  async function loadInvites(organizationId) {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando invitaciones:", error);
      return;
    }

    setInvites(data || []);
  }

  async function createProperty() {
    setPropertyMessage("");

    if (!organization) return;

    if (!newProperty.name.trim()) {
      setPropertyMessage("El nombre del alojamiento es obligatorio.");
      return;
    }

    if (!newProperty.tourist_registration_number.trim()) {
      setPropertyMessage("El número de licencia turística es obligatorio.");
      return;
    }

    if (!newProperty.police_establishment_code.trim()) {
      setPropertyMessage("El código de establecimiento SES es obligatorio.");
      return;
    }

    const { error } = await supabase.from("properties").insert({
      organization_id: organization.id,
      name: newProperty.name.trim(),
      type: newProperty.type,
      address: newProperty.address.trim(),
      city: newProperty.city.trim(),
      province: newProperty.province.trim(),
      postal_code: newProperty.postal_code.trim(),
      country: "España",
      tourist_registration_number: newProperty.tourist_registration_number.trim(),
      police_establishment_code: newProperty.police_establishment_code.trim(),
      active: true,
    });

    if (error) {
      console.error("Error creando alojamiento:", error);
      setPropertyMessage("No se pudo crear el alojamiento.");
      return;
    }

    setNewProperty(emptyProperty);
    setPropertyMessage("Alojamiento creado correctamente.");
    loadProperties(organization.id);
  }

  async function createBooking() {
    setBookingMessage("");
    setLastBookingLink("");

    if (!organization) return;

    if (!newBooking.property_id) {
      setBookingMessage("Selecciona un alojamiento.");
      return;
    }

    if (!newBooking.check_in || !newBooking.check_out) {
      setBookingMessage("Selecciona fecha de entrada y salida.");
      return;
    }

    const reference = newBooking.booking_reference.trim() || `RES-${Date.now()}`;
    const token = crypto.randomUUID();
    const checkinUrl = `${window.location.origin}/checkin/${token}`;

    const { error } = await supabase.from("bookings").insert({
      organization_id: organization.id,
      property_id: newBooking.property_id,
      booking_reference: reference,
      reference,
      platform: newBooking.platform,
      check_in: newBooking.check_in,
      check_out: newBooking.check_out,
      guest_count: Number(newBooking.guest_count),
      public_token: token,
      notes: newBooking.notes.trim(),
    });

    if (error) {
      console.error("Error creando reserva:", error);
      setBookingMessage("No se pudo crear la reserva.");
      return;
    }

    setLastBookingLink(checkinUrl);
    setNewBooking(emptyBooking);
    setBookingMessage("Reserva creada correctamente. Ya puedes enviar el enlace por WhatsApp.");
    loadBookings(organization.id);
  }

  function openWhatsApp(link) {
    const message = encodeURIComponent(
      `Hola, te envío el enlace para completar el check-in online de tu reserva:\n\n${link}\n\nGracias.`
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  async function updateCompanyName() {
    if (!companyName.trim() || !organization) return;

    const { error } = await supabase
      .from("organizations")
      .update({ name: companyName.trim() })
      .eq("id", organization.id);

    if (error) {
      console.error("Error actualizando empresa:", error);
      return;
    }

    setOrganization({ ...organization, name: companyName.trim() });
    setEditingCompany(false);
  }

  async function sendInvite() {
    setInviteMessage("");

    if (!inviteEmail.trim() || !organization || !user) return;

    const { error } = await supabase.from("organization_invites").insert({
      organization_id: organization.id,
      email: inviteEmail.trim().toLowerCase(),
      role: "member",
      invited_by: user.id,
    });

    if (error) {
      console.error("Error creando invitación:", error);
      setInviteMessage("No se pudo guardar la invitación.");
      return;
    }

    setInviteEmail("");
    setInviteMessage("Invitación guardada correctamente.");
    loadInvites(organization.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <main style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logo}>CH</div>
          <div>
            <h1 style={styles.brand}>ControlHuesped</h1>
            <p style={styles.smallText}>Panel profesional</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {sections.map((section) => (
            <button
              key={section.id}
              style={{
                ...styles.navItem,
                ...(activeSection === section.id ? styles.navItemActive : {}),
              }}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <section style={styles.content}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>ControlHuesped PRO</p>
            <h2 style={styles.title}>{pageTitle}</h2>
            <p style={styles.subtitle}>{organization?.name || "Preparando empresa..."}</p>
          </div>

          <button style={styles.primaryButton} onClick={() => setActiveSection("reservas")}>
            + Nueva reserva
          </button>
        </header>

        {loading ? (
          <section style={styles.panel}>
            <p style={styles.panelText}>Cargando panel...</p>
          </section>
        ) : (
          <>
            {activeSection === "inicio" && (
              <InicioSection
                properties={properties}
                bookings={bookings}
                invites={invites}
                setActiveSection={setActiveSection}
              />
            )}

            {activeSection === "alojamientos" && (
              <AlojamientosSection
                properties={properties}
                newProperty={newProperty}
                setNewProperty={setNewProperty}
                createProperty={createProperty}
                propertyMessage={propertyMessage}
              />
            )}

            {activeSection === "reservas" && (
              <ReservasSection
                properties={properties}
                bookings={bookings}
                newBooking={newBooking}
                setNewBooking={setNewBooking}
                createBooking={createBooking}
                bookingMessage={bookingMessage}
                lastBookingLink={lastBookingLink}
                openWhatsApp={openWhatsApp}
              />
            )}

            {activeSection === "huespedes" && (
              <ComingSection
                title="Huéspedes"
                text="Aquí veremos huéspedes por reserva, formularios completados, documentos, firmas y validación legal."
              />
            )}

            {activeSection === "documentos" && (
              <ComingSection
                title="Documentos"
                text="Aquí generaremos PDF legal, parte de viajeros, archivos firmados y exportaciones."
              />
            )}

            {activeSection === "enlaces" && (
              <EnlacesSection bookings={bookings} openWhatsApp={openWhatsApp} />
            )}

            {activeSection === "equipo" && (
              <EquipoSection
                user={user}
                organization={organization}
                editingCompany={editingCompany}
                setEditingCompany={setEditingCompany}
                companyName={companyName}
                setCompanyName={setCompanyName}
                updateCompanyName={updateCompanyName}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                sendInvite={sendInvite}
                inviteMessage={inviteMessage}
                invites={invites}
              />
            )}

            {activeSection === "ajustes" && (
              <ComingSection
                title="Ajustes"
                text="Aquí configuraremos datos legales, perfil, seguridad, privacidad, idioma y automatizaciones futuras."
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function InicioSection({ properties, bookings, invites, setActiveSection }) {
  return (
    <>
      <section style={styles.hero}>
        <div>
          <h3 style={styles.heroTitle}>Panel principal</h3>
          <p style={styles.heroText}>
            Controla alojamientos, reservas, huéspedes, enlaces y documentación legal desde una sola pantalla.
          </p>
        </div>

        <button style={styles.heroButton} onClick={() => setActiveSection("reservas")}>
          Crear reserva
        </button>
      </section>

      <section style={styles.cardsGrid}>
        <StatCard label="Reservas activas" value={bookings.length} />
        <StatCard label="Check-ins pendientes" value="0" />
        <StatCard label="Alojamientos" value={properties.length} />
        <StatCard label="Invitaciones" value={invites.length} />
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Ruta de trabajo recomendada</h3>
        <div style={styles.steps}>
          <Step number="1" text="Crea tu alojamiento con licencia turística y código SES." />
          <Step number="2" text="Crea una reserva vinculada al alojamiento." />
          <Step number="3" text="Envía el enlace de check-in al huésped por WhatsApp." />
          <Step number="4" text="Revisa huéspedes, firma y documentación legal." />
        </div>
      </section>
    </>
  );
}

function AlojamientosSection({
  properties,
  newProperty,
  setNewProperty,
  createProperty,
  propertyMessage,
}) {
  return (
    <>
      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Nuevo alojamiento</h3>

        <div style={styles.formGrid}>
          <input style={styles.input} placeholder="Nombre del alojamiento *" value={newProperty.name} onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })} />

          <select style={styles.input} value={newProperty.type} onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}>
            <option style={styles.selectOption} value="apartamento">Apartamento</option>
            <option style={styles.selectOption} value="casa">Casa</option>
            <option style={styles.selectOption} value="villa">Villa</option>
            <option style={styles.selectOption} value="habitacion">Habitación</option>
            <option style={styles.selectOption} value="hotel">Hotel</option>
          </select>

          <input style={styles.input} placeholder="Dirección" value={newProperty.address} onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })} />
          <input style={styles.input} placeholder="Ciudad" value={newProperty.city} onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })} />
          <input style={styles.input} placeholder="Provincia" value={newProperty.province} onChange={(e) => setNewProperty({ ...newProperty, province: e.target.value })} />
          <input style={styles.input} placeholder="Código postal" value={newProperty.postal_code} onChange={(e) => setNewProperty({ ...newProperty, postal_code: e.target.value })} />

          <input style={styles.input} placeholder="Número de licencia turística *" value={newProperty.tourist_registration_number} onChange={(e) => setNewProperty({ ...newProperty, tourist_registration_number: e.target.value })} />

          <input style={styles.input} placeholder="Código establecimiento SES *" value={newProperty.police_establishment_code} onChange={(e) => setNewProperty({ ...newProperty, police_establishment_code: e.target.value })} />
        </div>

        <button style={styles.primaryButton} onClick={createProperty}>
          Guardar alojamiento
        </button>

        {propertyMessage && <p style={styles.successText}>{propertyMessage}</p>}
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Mis alojamientos</h3>

        {properties.length === 0 ? (
          <p style={styles.panelText}>Todavía no has creado alojamientos.</p>
        ) : (
          <div style={styles.list}>
            {properties.map((property) => (
              <div key={property.id} style={styles.listItem}>
                <div>
                  <strong>{property.name}</strong>
                  <p style={styles.meta}>
                    {property.city || "Sin ciudad"} · Licencia: {property.tourist_registration_number}
                  </p>
                  <p style={styles.meta}>SES: {property.police_establishment_code}</p>
                </div>

                <span style={styles.badge}>{property.type || "alojamiento"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReservasSection({
  properties,
  bookings,
  newBooking,
  setNewBooking,
  createBooking,
  bookingMessage,
  lastBookingLink,
  openWhatsApp,
}) {
  return (
    <>
      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Nueva reserva</h3>

        {properties.length === 0 ? (
          <p style={styles.panelText}>Primero crea un alojamiento antes de añadir reservas.</p>
        ) : (
          <>
            <div style={styles.formGrid}>
              <select style={styles.input} value={newBooking.property_id} onChange={(e) => setNewBooking({ ...newBooking, property_id: e.target.value })}>
                <option style={styles.selectOption} value="">Selecciona alojamiento *</option>
                {properties.map((property) => (
                  <option style={styles.selectOption} key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>

              <input style={styles.input} placeholder="Referencia de reserva" value={newBooking.booking_reference} onChange={(e) => setNewBooking({ ...newBooking, booking_reference: e.target.value })} />

              <select style={styles.input} value={newBooking.platform} onChange={(e) => setNewBooking({ ...newBooking, platform: e.target.value })}>
                <option style={styles.selectOption} value="Directa">Directa</option>
                <option style={styles.selectOption} value="Airbnb">Airbnb</option>
                <option style={styles.selectOption} value="Booking">Booking</option>
                <option style={styles.selectOption} value="Vrbo">Vrbo</option>
                <option style={styles.selectOption} value="Otro">Otro</option>
              </select>

              <input style={styles.input} type="number" min="1" placeholder="Nº huéspedes" value={newBooking.guest_count} onChange={(e) => setNewBooking({ ...newBooking, guest_count: e.target.value })} />

              <input style={styles.input} type="date" value={newBooking.check_in} onChange={(e) => setNewBooking({ ...newBooking, check_in: e.target.value })} />

              <input style={styles.input} type="date" value={newBooking.check_out} onChange={(e) => setNewBooking({ ...newBooking, check_out: e.target.value })} />

              <input style={styles.input} placeholder="Notas internas" value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} />
            </div>

            <button style={styles.primaryButton} onClick={createBooking}>
              Crear reserva
            </button>

            {bookingMessage && <p style={styles.successText}>{bookingMessage}</p>}

            {lastBookingLink && (
              <div style={styles.linkBox}>
                <p style={styles.linkText}>{lastBookingLink}</p>

                <div style={styles.actionRow}>
                  <button style={styles.secondaryButton} onClick={() => navigator.clipboard.writeText(lastBookingLink)}>
                    Copiar enlace
                  </button>

                  <button style={styles.greenButton} onClick={() => openWhatsApp(lastBookingLink)}>
                    Enviar por WhatsApp
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Reservas creadas</h3>

        {bookings.length === 0 ? (
          <p style={styles.panelText}>Todavía no has creado reservas.</p>
        ) : (
          <div style={styles.list}>
            {bookings.map((booking) => {
              const link = `${window.location.origin}/checkin/${booking.public_token}`;

              return (
                <div key={booking.id} style={styles.listItem}>
                  <div>
                    <strong>{booking.booking_reference || booking.reference}</strong>
                    <p style={styles.meta}>
                      {booking.properties?.name || "Alojamiento"} · {booking.check_in} → {booking.check_out}
                    </p>
                    <p style={styles.meta}>
                      {booking.guest_count} huésped/es · {booking.platform}
                    </p>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.secondaryButton} onClick={() => navigator.clipboard.writeText(link)}>
                      Copiar
                    </button>
                    <button style={styles.greenButton} onClick={() => openWhatsApp(link)}>
                      WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function EnlacesSection({ bookings, openWhatsApp }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.panelTitle}>Enlaces de check-in</h3>

      {bookings.length === 0 ? (
        <p style={styles.panelText}>Todavía no hay enlaces porque no has creado reservas.</p>
      ) : (
        <div style={styles.list}>
          {bookings.map((booking) => {
            const url = `${window.location.origin}/checkin/${booking.public_token}`;

            return (
              <div key={booking.id} style={styles.listItem}>
                <div>
                  <strong>{booking.booking_reference || booking.reference}</strong>
                  <p style={styles.meta}>{url}</p>
                </div>

                <div style={styles.actionRow}>
                  <button style={styles.secondaryButton} onClick={() => navigator.clipboard.writeText(url)}>
                    Copiar
                  </button>

                  <button style={styles.greenButton} onClick={() => openWhatsApp(url)}>
                    WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EquipoSection({
  user,
  organization,
  editingCompany,
  setEditingCompany,
  companyName,
  setCompanyName,
  updateCompanyName,
  inviteEmail,
  setInviteEmail,
  sendInvite,
  inviteMessage,
  invites,
}) {
  return (
    <>
      <section style={styles.gridTwo}>
        <section style={styles.panel}>
          <h3 style={styles.panelTitle}>Empresa</h3>

          <div style={styles.infoBox}>
            <p style={styles.infoLabel}>Nombre de empresa</p>

            {editingCompany ? (
              <div style={styles.editRow}>
                <input style={styles.input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <button style={styles.greenButton} onClick={updateCompanyName}>Guardar</button>
                <button style={styles.secondaryButton} onClick={() => setEditingCompany(false)}>Cancelar</button>
              </div>
            ) : (
              <div style={styles.companyRow}>
                <strong>{organization?.name}</strong>
                <button style={styles.secondaryButton} onClick={() => setEditingCompany(true)}>Editar</button>
              </div>
            )}
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoLabel}>Usuario actual</p>
            <strong>{user?.email}</strong>
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoLabel}>Rol</p>
            <strong>Propietario</strong>
          </div>
        </section>

        <section style={styles.panel}>
          <h3 style={styles.panelTitle}>Invitar usuarios</h3>
          <p style={styles.panelText}>Invita a pareja, trabajadores o miembros de una inmobiliaria.</p>

          <div style={styles.inviteRow}>
            <input type="email" placeholder="email@ejemplo.com" style={styles.input} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />

            <button style={styles.primaryButton} onClick={sendInvite}>
              Invitar
            </button>
          </div>

          {inviteMessage && <p style={styles.successText}>{inviteMessage}</p>}
        </section>
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Invitaciones pendientes</h3>

        {invites.length === 0 ? (
          <p style={styles.panelText}>Todavía no hay invitaciones.</p>
        ) : (
          <div style={styles.list}>
            {invites.map((invite) => (
              <div key={invite.id} style={styles.listItem}>
                <div>
                  <strong>{invite.email}</strong>
                  <p style={styles.meta}>Rol: {invite.role}</p>
                </div>

                <span style={styles.badge}>{invite.accepted_at ? "Aceptada" : "Pendiente"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ComingSection({ title, text }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      <p style={styles.panelText}>{text}</p>
      <div style={styles.emptyBox}>Sección preparada para el siguiente bloque.</div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <h3 style={styles.cardNumber}>{value}</h3>
    </div>
  );
}

function Step({ number, text }) {
  return (
    <div style={styles.step}>
      <span style={styles.stepIcon}>{number}</span>
      <p>{text}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    background: "#020617",
    color: "white",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial",
    overflowX: "hidden",
  },
  sidebar: {
    width: "292px",
    background: "rgba(15, 23, 42, 0.96)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "34px",
  },
  logo: {
    width: "50px",
    height: "50px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #3b82f6, #22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },
  brand: { margin: 0, fontSize: "18px" },
  smallText: { margin: "4px 0 0", color: "#94a3b8", fontSize: "13px" },
  nav: { display: "flex", flexDirection: "column", gap: "10px", flex: 1 },
  navItem: {
    width: "100%",
    textAlign: "left",
    padding: "13px 14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navItemActive: {
    background: "linear-gradient(135deg, rgba(37,99,235,0.36), rgba(34,197,94,0.18))",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "white",
    fontWeight: "800",
  },
  logoutButton: {
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.04)",
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: "700",
    marginTop: "18px",
  },
  content: { flex: 1, padding: "34px", overflow: "auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "26px",
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    color: "#60a5fa",
    fontWeight: "900",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  title: { margin: "6px 0 0", fontSize: "38px", letterSpacing: "-0.05em" },
  subtitle: { margin: "6px 0 0", color: "#94a3b8" },
  primaryButton: {
    padding: "14px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },
  greenButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },
  hero: {
    background: "radial-gradient(circle at top left, rgba(59,130,246,0.35), transparent 35%), linear-gradient(135deg, rgba(37,99,235,0.20), rgba(34,197,94,0.12))",
    border: "1px solid rgba(96,165,250,0.22)",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
  heroTitle: { margin: "0 0 8px", fontSize: "24px" },
  heroText: { margin: 0, color: "#cbd5e1", lineHeight: 1.55 },
  heroButton: {
    padding: "14px 18px",
    borderRadius: "16px",
    border: "none",
    background: "white",
    color: "#0f172a",
    fontWeight: "900",
    cursor: "pointer",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  card: {
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "22px",
  },
  cardLabel: { margin: 0, color: "#94a3b8", fontSize: "14px" },
  cardNumber: { margin: "12px 0 0", fontSize: "36px" },
  panel: {
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "24px",
    marginBottom: "24px",
  },
  panelTitle: { margin: "0 0 15px", fontSize: "22px" },
  panelText: { margin: 0, color: "#94a3b8", lineHeight: 1.55 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  input: {
    width: "100%",
    minWidth: "0",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0f172a",
    color: "white",
    colorScheme: "dark",
    outline: "none",
  },
  selectOption: {
    background: "#0f172a",
    color: "white",
  },
  successText: { color: "#22c55e", marginTop: "12px", fontWeight: "800" },
  linkBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.22)",
  },
  linkText: {
    margin: "0 0 12px",
    color: "#bbf7d0",
    fontSize: "13px",
    wordBreak: "break-all",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  list: { display: "grid", gap: "12px" },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "15px",
    flexWrap: "wrap",
  },
  meta: { margin: "5px 0 0", color: "#94a3b8", fontSize: "13px", wordBreak: "break-all" },
  badge: {
    background: "rgba(250,204,21,0.14)",
    border: "1px solid rgba(250,204,21,0.3)",
    color: "#fde68a",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  infoBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "15px",
    marginBottom: "12px",
  },
  infoLabel: { margin: "0 0 7px", color: "#94a3b8", fontSize: "13px" },
  companyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  editRow: {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  inviteRow: { display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" },
  steps: { display: "grid", gap: "14px" },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "18px",
    padding: "14px",
    color: "#cbd5e1",
  },
  stepIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "900",
    flexShrink: 0,
  },
  emptyBox: {
    marginTop: "18px",
    border: "1px dashed rgba(255,255,255,0.18)",
    borderRadius: "20px",
    padding: "22px",
    color: "#94a3b8",
    background: "rgba(255,255,255,0.03)",
  },
};