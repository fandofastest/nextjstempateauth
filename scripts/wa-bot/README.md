# WhatsApp Bot for KPU Kota Dumai Digital Asset System

Bot WhatsApp untuk sistem aset digital KPU Kota Dumai yang secara otomatis mengupload file dari pesan WhatsApp ke sistem.

## Fitur

- **Auto Upload**: Otomatis mengupload file (gambar, video, dokumen) dari pesan WhatsApp
- **Tag Extraction**: Mengekstrak hashtags (#tag) dari caption/pesan sebagai tags
- **Category Support**: Mendukung kategorisasi file
- **Group & DM Support**: Mendukung upload dari grup dan pesan pribadi
- **Authentication**: Integrasi dengan sistem auth KPU Kota Dumai

## Update Terbaru - Tags Support

### ✅ Fitur Tags Baru
Bot sekarang mendukung ekstraksi tags otomatis dari pesan WhatsApp:

1. **Hashtag Detection**: Bot akan mendeteksi hashtags dalam format `#namatag`
2. **Auto Extraction**: Tags otomatis diekstrak dari caption gambar/video atau teks pesan
3. **Clean Description**: Hashtags dihapus dari deskripsi untuk menjaga kebersihan
4. **API Integration**: Tags dikirim ke API `/api/files` dalam format JSON array

### Contoh Penggunaan Tags

**Pesan dengan tags:**
```
Foto kegiatan sosialisasi pemilu #sosialisasi #pemilu #kpu #dumai
```

**Hasil:**
- **Tags**: `["sosialisasi", "pemilu", "kpu", "dumai"]`
- **Description**: `"Foto kegiatan sosialisasi pemilu"`

### Technical Implementation

```typescript
// Extract tags from description (look for #hashtags)
let tags: string[] = []
if (description) {
  const hashtagRegex = /#(\w+)/g
  const matches = description.match(hashtagRegex)
  if (matches) {
    tags = matches.map(tag => tag.slice(1)) // remove # symbol
    // Remove hashtags from description to keep it clean
    description = description.replace(hashtagRegex, '').trim()
  }
}

// Send to API with tags
await uploadToApi({ 
  buffer, fileName, mimeType, category, 
  isPublic, description, phone, tags 
})
```

## Environment Variables

```env
APP_BASE_URL=http://localhost:3000
SERVICE_BEARER=your_bearer_token
GROUP_IDS=group1@g.us,group2@g.us
INCLUDE_DMS=true
MAX_SIZE_MB=50
LOGIN_EMAIL=admin@example.com
LOGIN_PASSWORD=password
```

## Installation & Setup

1. Install dependencies:
```bash
cd scripts/wa-bot
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

3. Run bot:
```bash
npm start
```

## File Structure

```
scripts/wa-bot/
├── src/
│   └── index.ts          # Main bot logic
├── data/
│   └── processed.json    # Processed messages store
├── auth/                 # WhatsApp auth session
├── package.json
├── tsconfig.json
└── README.md
```

## Logging

Bot menggunakan Pino logger dengan level info. Logs akan menampilkan:
- Tags yang diekstrak dari pesan
- Status upload file
- Error handling
- Authentication status

## API Integration

Bot terintegrasi dengan endpoint `/api/files` yang mendukung:
- File upload dengan FormData
- Category assignment
- Tags dalam format JSON array
- Public/private visibility
- Description dan metadata lainnya

## Changelog

### v1.1.0 - Tags Support
- ✅ Added hashtag extraction from messages
- ✅ Clean description after tag removal
- ✅ JSON tags format for API compatibility
- ✅ Enhanced logging for tag extraction
- ✅ Backward compatibility maintained

### v1.0.0 - Initial Release
- Basic file upload functionality
- WhatsApp integration
- Authentication system
- Group and DM support
