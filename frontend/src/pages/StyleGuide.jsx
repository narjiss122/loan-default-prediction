import { useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import RiskBadge from '../components/ui/RiskBadge'

function Section({ title, children }) {
  return (
    <section className="mb-14">
      <h2 className="text-xl font-semibold text-gray-800 mb-5">{title}</h2>
      <Card className="flex flex-wrap items-start gap-5">
        {children}
      </Card>
    </section>
  )
}

// Tailwind's content scanner needs literal class names, not interpolated
// strings — so each shade maps to a fully-written class here.
const SWATCHES = {
  primary: {
    50: 'bg-primary-50', 100: 'bg-primary-100', 200: 'bg-primary-200', 300: 'bg-primary-300',
    400: 'bg-primary-400', 500: 'bg-primary-500', 600: 'bg-primary-600', 700: 'bg-primary-700',
    800: 'bg-primary-800', 900: 'bg-primary-900',
  },
  danger: {
    50: 'bg-danger-50', 100: 'bg-danger-100', 200: 'bg-danger-200', 300: 'bg-danger-300',
    400: 'bg-danger-400', 500: 'bg-danger-500', 600: 'bg-danger-600', 700: 'bg-danger-700',
    800: 'bg-danger-800', 900: 'bg-danger-900',
  },
  warning: {
    50: 'bg-warning-50', 100: 'bg-warning-100', 200: 'bg-warning-200', 300: 'bg-warning-300',
    400: 'bg-warning-400', 500: 'bg-warning-500', 600: 'bg-warning-600', 700: 'bg-warning-700',
    800: 'bg-warning-800', 900: 'bg-warning-900',
  },
}

const HEXES = {
  primary: { 50: '#f0f9f4', 100: '#dbf0e3', 200: '#b8e0c8', 300: '#8cc9a8', 400: '#5fae85',
             500: '#3f9367', 600: '#2f7a52', 700: '#266143', 800: '#1f4d36', 900: '#1a3f2d' },
  danger:  { 50: '#fdf2f2', 100: '#fbe1e1', 200: '#f5c2c2', 300: '#e89a9a', 400: '#d97070',
             500: '#c84c4c', 600: '#b13a3a', 700: '#8f2e2e', 800: '#6f2424', 900: '#5c1f1f' },
  warning: { 50: '#fefaf0', 100: '#fcefcf', 200: '#f7dd99', 300: '#efc665', 400: '#e3ad3f',
             500: '#cf9530', 600: '#b07726', 700: '#8c5d1f', 800: '#6c481a', 900: '#573a17' },
}

function Swatch({ name, shade }) {
  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-lg border border-gray-200 mb-1 ${SWATCHES[name][shade]}`} />
      <p className="text-xs text-gray-500">{shade}</p>
      <p className="text-[10px] text-gray-400">{HEXES[name][shade]}</p>
    </div>
  )
}

export default function StyleGuide() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Design System — Style Guide</h1>
      <p className="text-sm text-gray-500 mb-12">Tous les composants partagés, en un seul écran.</p>

      <section className="mb-14">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">Typographie</h2>
        <Card className="flex flex-col gap-5">
          <div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">Titre de page</p>
            <p className="text-xs text-gray-400 mt-1">text-3xl · font-bold · tracking-tight · text-gray-900</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800">Titre de section</p>
            <p className="text-xs text-gray-400 mt-1">text-xl · font-semibold · text-gray-800</p>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Titre de carte</p>
            <p className="text-xs text-gray-400 mt-1">text-base · font-semibold · text-gray-900</p>
          </div>
          <div>
            <p className="text-sm font-normal text-gray-600 leading-relaxed">
              Texte de corps — utilisé pour les paragraphes et le contenu courant. Poids normal, contraste clair avec les titres.
            </p>
            <p className="text-xs text-gray-400 mt-1">text-sm · font-normal · text-gray-600 · leading-relaxed</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Label de champ</p>
            <p className="text-xs text-gray-400 mt-1">text-sm · font-medium · text-gray-700</p>
          </div>
          <div>
            <p className="text-xs font-normal text-gray-500">Texte d'aide / légende</p>
            <p className="text-xs text-gray-400 mt-1">text-xs · font-normal · text-gray-500</p>
          </div>
        </Card>
      </section>

      <Section title="Couleurs — Primary (forest green)">
        {['50','100','200','300','400','500','600','700','800','900'].map(shade => (
          <Swatch key={shade} name="primary" shade={shade} />
        ))}
      </Section>

      <Section title="Couleurs — Danger">
        {['50','100','200','300','400','500','600','700','800','900'].map(shade => (
          <Swatch key={shade} name="danger" shade={shade} />
        ))}
      </Section>

      <Section title="Couleurs — Warning">
        {['50','100','200','300','400','500','600','700','800','900'].map(shade => (
          <Swatch key={shade} name="warning" shade={shade} />
        ))}
      </Section>

      <Section title="Button">
        <Button variant="primary">Primaire</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>Primaire (désactivé)</Button>
        <Button variant="secondary" disabled>Secondaire (désactivé)</Button>
        <Button variant="danger" disabled>Danger (désactivé)</Button>
      </Section>

      <Section title="Card">
        <Card className="w-72">
          <p className="text-base font-semibold text-gray-900 mb-1.5">Titre de carte</p>
          <p className="text-sm font-normal text-gray-600 leading-relaxed">Conteneur arrondi, ombre douce, padding généreux.</p>
        </Card>
      </Section>

      <Section title="Input">
        <div className="w-64">
          <Input
            label="Nom complet"
            placeholder="Jean Dupont"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        </div>
        <div className="w-64">
          <Input label="Revenu mensuel" type="number" placeholder="8000" />
        </div>
        <div className="w-64">
          <Input label="Email" placeholder="jean@example.com" error="Email invalide" />
        </div>
      </Section>

      <Section title="Select">
        <div className="w-64">
          <Select
            label="Statut professionnel"
            options={[
              { value: 'SALARIE', label: 'Salarié' },
              { value: 'SELF_EMPLOYED', label: 'Indépendant' },
              { value: 'RETIRED', label: 'Retraité' },
            ]}
          />
        </div>
        <div className="w-64">
          <Select
            label="Avec erreur"
            error="Sélection requise"
            options={[{ value: '', label: 'Choisir...' }]}
          />
        </div>
      </Section>

      <Section title="StatusBadge">
        <StatusBadge status="SUBMITTED" />
        <StatusBadge status="PREDICTED" />
        <StatusBadge status="ACCEPTED" />
        <StatusBadge status="REFUSED" />
      </Section>

      <Section title="RiskBadge">
        <RiskBadge verdict="LOW RISK" />
        <RiskBadge verdict="HIGH RISK" />
        <RiskBadge verdict={null} />
      </Section>
    </div>
  )
}
