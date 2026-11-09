import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MessageCircle, Copy, Save, Users, ArrowLeft } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

interface GuestEntry {
  name: string
  link: string
}

const MESSAGE_TEMPLATES = [
  {
    id: 'formal',
    name: 'Formal',
    template: 'Assalamualaikum Wr. Wb.\n\nYth. Bapak/Ibu/Saudara/i\n{name}\n\nDi Tempat\n\nDengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i dan teman-teman untuk menghadiri acara pernikahan kami,\n\nUndangan dapat diakses melalui link berikut.\n{link}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i dan teman-teman berkenan untuk hadir dan memberikan doa restu.\n\nAtas perhatian, kehadiran dan doanya, kami ucapkan banyak terima kasih.',
  },
  {
    id: 'casual',
    name: 'Casual',
    template: 'Halo {name}! 👋\n\nKami akan segera menikah dan sangat ingin kehadiranmu di hari bahagia kami!\n\nCek undangan lengkapnya di sini ya:\n{link}\n\nJangan lupa save the date ya! 💕',
  },
  {
    id: 'islamic',
    name: 'Islami',
    template: 'Assalamualaikum {name}\n\nDengan memohon Rahmat dan Ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan kami.\n\nKami mengharapkan kehadiran Bapak/Ibu/Saudara/i untuk memberikan doa restu.\n\nUndangan lengkap dapat dilihat melalui tautan berikut:\n{link}\n\nWassalamualaikum warahmatullahi wabarakatuh.',
  },
  {
    id: 'short',
    name: 'Singkat',
    template: 'Hai {name}!\n\nUndangan pernikahan kami:\n{link}\n\nMohon doa restu ya! ❤️',
  },
]

export default function ShareWhatsApp() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestNames, setGuestNames] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('formal')
  const [guestList, setGuestList] = useState<GuestEntry[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
        if (error) throw error
        setEvent(data)
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchEvent()
  }, [id])

  useEffect(() => {
    if (!guestNames.trim()) {
      setGuestList([])
      return
    }
    const invitationLink = event?.slug ? `${window.location.origin}/undangan/${event.slug}` : ''
    setGuestList(
      guestNames
        .split('\n')
        .filter((name) => name.trim())
        .map((name) => ({
          name: name.trim(),
          link: `${invitationLink}?to=${encodeURIComponent(name.trim())}`,
        })),
    )
  }, [guestNames, event])

  const getMessage = (guest: GuestEntry) => {
    const template = MESSAGE_TEMPLATES.find((item) => item.id === selectedTemplate)
    return template?.template.replace('{name}', guest.name).replace('{link}', guest.link) ?? ''
  }

  const generateWhatsAppLink = (guest: GuestEntry) =>
    `https://wa.me/?text=${encodeURIComponent(getMessage(guest))}`

  const handleCopyMessage = (guest: GuestEntry) => {
    void navigator.clipboard.writeText(getMessage(guest))
    alert('Pesan berhasil disalin!')
  }

  const handleSave = async () => {
    if (!id || guestList.length === 0) return
    try {
      const { error: deleteError } = await supabase.from('event_guests').delete().eq('event_id', id)
      if (deleteError) throw deleteError
      const { error } = await supabase.from('event_guests').insert(
        guestList.map((guest) => ({ event_id: id, name: guest.name, invitation_link: guest.link })),
      )
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving guests:', error)
      alert('Gagal menyimpan data tamu')
    }
  }

  if (loading) {
    return (
      <EventWorkspaceLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      </EventWorkspaceLayout>
    )
  }

  if (!event) {
    return (
      <EventWorkspaceLayout>
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Acara tidak ditemukan</h2>
        </div>
      </EventWorkspaceLayout>
    )
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link to={`/events/${event.id}`} className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Kembali ke Workspace
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Share Undangan via WhatsApp</h1>
            <p className="mt-1 text-sm text-gray-500">Generate link WhatsApp untuk setiap tamu dengan nama personal</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={guestList.length === 0}
            className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saved ? 'Tersimpan!' : 'Simpan Tamu'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-4 rounded-lg bg-white p-6 shadow">
              <h2 className="flex items-center text-lg font-medium text-gray-900">
                <Users className="mr-2 h-5 w-5" />
                Daftar Nama Tamu
              </h2>
              <p className="text-sm text-gray-500">Masukkan nama tamu, satu nama per baris (Enter untuk baris baru)</p>
              <textarea
                value={guestNames}
                onChange={(e) => setGuestNames(e.target.value)}
                placeholder={'Contoh:\nBudi Santoso\nSiti Aminah\nAhmad Wijaya'}
                rows={15}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-sm text-gray-600">Total: {guestList.length} tamu</div>
            </div>

            <div className="space-y-4 rounded-lg bg-white p-6 shadow">
              <h2 className="flex items-center text-lg font-medium text-gray-900">
                <MessageCircle className="mr-2 h-5 w-5" />
                Pilih Template Ucapan
              </h2>
              <div className="space-y-2">
                {MESSAGE_TEMPLATES.map((template) => (
                  <label
                    key={template.id}
                    className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors ${
                      selectedTemplate === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-gray-500">
                        {template.template.replace('{name}', '[Nama Tamu]').replace('{link}', '[Link Undangan]')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Tombol Share WhatsApp</h2>
            <p className="text-sm text-gray-500">
              Klik tombol WhatsApp untuk langsung membuka aplikasi WhatsApp dengan pesan yang sudah terisi
            </p>
            {guestList.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Belum ada nama tamu. Masukkan nama di kolom sebelah kiri.</div>
            ) : (
              <div className="max-h-[600px] space-y-2 overflow-y-auto">
                {guestList.map((guest, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border border-gray-200 p-3 transition-colors hover:border-indigo-300">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{guest.name}</div>
                      <div className="truncate text-xs text-gray-500">{guest.link}</div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(guest)}
                        className="rounded-md p-2 text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        title="Salin pesan"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={generateWhatsAppLink(guest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center rounded-md bg-green-500 px-3 py-2 text-white transition-colors hover:bg-green-600"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WA
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
