export const INIT_BRANDS = [
  { id: 1, slug: 'chanel', name: 'Chanel', type: 'original', origin: 'Fransa', founded: 1910, logo: 'CH', category: 'Designer', bio: "1910'dan bu yana moda ve parfüm dünyasının öncüsü.", likes: 9823, active: true },
  { id: 2, slug: 'dior', name: 'Dior', type: 'original', origin: 'Fransa', founded: 1947, logo: 'CD', category: 'Designer', bio: "Christian Dior'un yarattığı zamansız lüks.", likes: 8741, active: true },
  { id: 3, slug: 'tom-ford', name: 'Tom Ford', type: 'original', origin: 'ABD', founded: 2005, logo: 'TF', category: 'Niche', bio: 'Cesur, seksi ve sofistike parfümler.', likes: 7654, active: true },
  { id: 4, slug: 'ysl', name: 'Yves Saint Laurent', type: 'original', origin: 'Fransa', founded: 1962, logo: 'YSL', category: 'Designer', bio: 'Özgürlüğü ve gücü simgeleyen parfümler.', likes: 6532, active: true },
  { id: 101, slug: 'mfy', name: 'MFY', type: 'muadil', origin: 'Türkiye', founded: 2015, logo: 'MFY', category: '', bio: "Türkiye'nin önde gelen muadil parfüm markası.", likes: 4200, active: true },
  { id: 102, slug: 'zara-parfums', name: 'Zara Parfums', type: 'muadil', origin: 'İspanya', founded: 2010, logo: 'ZP', category: '', bio: 'Uygun şık parfümler.', likes: 3800, active: true },
  { id: 103, slug: 'lattafa', name: 'Lattafa', type: 'muadil', origin: 'BAE', founded: 2004, logo: 'LA', category: '', bio: "Orta Doğu'nun prestijli muadil parfüm evi.", likes: 5100, active: true },
  { id: 104, slug: 'armaf', name: 'Armaf', type: 'muadil', origin: 'BAE', founded: 2012, logo: 'AR', category: '', bio: 'Lüksü demokratize eden parfüm evi.', likes: 4600, active: true },
];

export const INIT_PERFUMES = [
  { id: 1, slug: 'n5', name: 'N°5', brandId: 1, brandSlug: 'chanel', brandName: 'Chanel', year: 1921, gender: 'Kadın', notes: { top: ['Ylang-Ylang', 'Neroli'], heart: ['Iris', 'Rose'], base: ['Sandalwood', 'Vetiver'] }, description: 'Tarihin en ikonik parfümü.', likes: 4821, commentCount: 12, image: 'floral', active: true },
  { id: 2, slug: 'bleu-de-chanel', name: 'Bleu de Chanel', brandId: 1, brandSlug: 'chanel', brandName: 'Chanel', year: 2010, gender: 'Erkek', notes: { top: ['Grapefruit', 'Lemon'], heart: ['Ginger', 'Cedar'], base: ['Labdanum', 'Sandalwood'] }, description: 'Özgür ruhlu adamın kokusu. Taze, ahşap, mineralik.', likes: 5234, commentCount: 18, image: 'woody', active: true },
  { id: 3, slug: 'sauvage', name: 'Sauvage', brandId: 2, brandSlug: 'dior', brandName: 'Dior', year: 2015, gender: 'Erkek', notes: { top: ['Bergamot', 'Pepper'], heart: ['Lavender', 'Sichuan Pepper'], base: ['Ambroxide', 'Cedarwood'] }, description: "Vahşi doğanın çağrısı.", likes: 6123, commentCount: 25, image: 'fresh', active: true },
  { id: 4, slug: 'j-adore', name: "J'adore", brandId: 2, brandSlug: 'dior', brandName: 'Dior', year: 1999, gender: 'Kadın', notes: { top: ['Pear', 'Melon'], heart: ['Rose', 'Jasmine'], base: ['Musk', 'Blackberry'] }, description: 'Feminen zarafetin simgesi.', likes: 3789, commentCount: 9, image: 'floral', active: true },
  { id: 5, slug: 'black-orchid', name: 'Black Orchid', brandId: 3, brandSlug: 'tom-ford', brandName: 'Tom Ford', year: 2006, gender: 'Unisex', notes: { top: ['Truffle', 'Bergamot'], heart: ['Black Orchid', 'Lotus'], base: ['Patchouli', 'Vanilla'] }, description: 'Karanlık ve çekici.', likes: 4567, commentCount: 14, image: 'oriental', active: true },
  { id: 6, slug: 'oud-wood', name: 'Oud Wood', brandId: 3, brandSlug: 'tom-ford', brandName: 'Tom Ford', year: 2007, gender: 'Unisex', notes: { top: ['Oud Wood', 'Rosewood'], heart: ['Cardamom', 'Sandalwood'], base: ['Vetiver', 'Amber'] }, description: 'Egzotik oryantal ahşap.', likes: 3654, commentCount: 7, image: 'oud', active: true },
  { id: 7, slug: 'libre', name: 'Libre', brandId: 4, brandSlug: 'ysl', brandName: 'YSL', year: 2019, gender: 'Kadın', notes: { top: ['Mandarin', 'Cardamom'], heart: ['Lavender', 'Orange Blossom'], base: ['Musk', 'Vanilla'] }, description: 'Özgürlüğün parfümü.', likes: 3987, commentCount: 11, image: 'floral', active: true },
];

export const INIT_MUADIL = [
  { id: 101, slug: 'mfy-sauvage-benzeri', name: 'Sauvage Benzeri', brandId: 101, brandSlug: 'mfy', brandName: 'MFY', targetPerfumeId: 3, targetPerfumeName: 'Sauvage', targetBrandName: 'Dior', description: "MFY'nin Dior Sauvage'a en yakın yorumu.", active: true },
  { id: 102, slug: 'zara-feelings', name: 'Feelings', brandId: 102, brandSlug: 'zara-parfums', brandName: 'Zara Parfums', targetPerfumeId: 2, targetPerfumeName: 'Bleu de Chanel', targetBrandName: 'Chanel', description: "Bleu de Chanel'e yakın taze yorumu.", active: true },
  { id: 103, slug: 'lattafa-yara', name: 'Yara', brandId: 103, brandSlug: 'lattafa', brandName: 'Lattafa', targetPerfumeId: 1, targetPerfumeName: 'N°5', targetBrandName: 'Chanel', description: "N°5'in oryantal yorumu.", active: true },
  { id: 104, slug: 'armaf-club-de-nuit', name: 'Club De Nuit Intense', brandId: 104, brandSlug: 'armaf', brandName: 'Armaf', targetPerfumeId: 2, targetPerfumeName: 'Bleu de Chanel', targetBrandName: 'Chanel', description: "Bleu de Chanel'e çok yakın.", active: true },
  { id: 105, slug: 'mfy-bleu-benzeri', name: 'Bleu Benzeri', brandId: 101, brandSlug: 'mfy', brandName: 'MFY', targetPerfumeId: 2, targetPerfumeName: 'Bleu de Chanel', targetBrandName: 'Chanel', description: "MFY'nin Bleu de Chanel yorumu.", active: true },
  { id: 106, slug: 'zara-vibrant-leather', name: 'Vibrant Leather', brandId: 102, brandSlug: 'zara-parfums', brandName: 'Zara Parfums', targetPerfumeId: 3, targetPerfumeName: 'Sauvage', targetBrandName: 'Dior', description: "Sauvage'ın çok yakın yorumu.", active: true },
  { id: 107, slug: 'lattafa-oud-mood', name: 'Oud Mood', brandId: 103, brandSlug: 'lattafa', brandName: 'Lattafa', targetPerfumeId: 5, targetPerfumeName: 'Black Orchid', targetBrandName: 'Tom Ford', description: "Black Orchid'e yakın oryantal.", active: true },
  { id: 108, slug: 'armaf-voyage', name: 'Voyage', brandId: 104, brandSlug: 'armaf', brandName: 'Armaf', targetPerfumeId: 3, targetPerfumeName: 'Sauvage', targetBrandName: 'Dior', description: 'Sauvage yorumu.', active: true },
  { id: 109, slug: 'mfy-n5-benzeri', name: 'N°5 Benzeri', brandId: 101, brandSlug: 'mfy', brandName: 'MFY', targetPerfumeId: 1, targetPerfumeName: 'N°5', targetBrandName: 'Chanel', description: 'Klasik N°5 yorumu.', active: true },
  { id: 110, slug: 'patronus-sauvage', name: 'Patronus Sauvage', brandId: 101, brandSlug: 'mfy', brandName: 'Patronus', targetPerfumeId: 3, targetPerfumeName: 'Sauvage', targetBrandName: 'Dior', description: "Patronus'un Sauvage yorumu.", active: true },
];

export const INIT_COMMENTS = [
  { id: 1, muadilPerfumeId: 101, userId: 3, userName: 'Ali Yılmaz', userAvatar: 'A', date: '13.05.2026', similarity: 8, projection: 5, longevity: 6, text: 'Bence iyi bir muadil olmuş, MFY güzel çalışmış.', status: 'approved', createdAt: Date.now() - 86400000 },
  { id: 2, muadilPerfumeId: 101, userId: 4, userName: 'Selin K.', userAvatar: 'S', date: '12.05.2026', similarity: 9, projection: 8, longevity: 7, text: "Sauvage'a gerçekten çok yakın, tatmin edici.", status: 'approved', createdAt: Date.now() - 172800000 },
  { id: 3, muadilPerfumeId: 102, userId: 3, userName: 'Ali Yılmaz', userAvatar: 'A', date: '11.05.2026', similarity: 9, projection: 8, longevity: 7, text: "Bleu de Chanel'e gerçekten çok benziyor.", status: 'approved', createdAt: Date.now() - 259200000 },
  { id: 4, muadilPerfumeId: 101, userId: 5, userName: 'Mehmet T.', userAvatar: 'M', date: '10.05.2026', similarity: 7, projection: 6, longevity: 5, text: 'Güzel ama orijinali kadar kalıcı değil.', status: 'pending', createdAt: Date.now() - 345600000 },
];

export const INIT_USERS = [
  { id: 1, name: 'Admin', email: 'admin@muadilci.com', role: 'admin', avatar: 'A', active: true, joinDate: '01.01.2025' },
  { id: 2, name: 'Moderatör', email: 'mod@muadilci.com', role: 'moderator', avatar: 'M', active: true, joinDate: '01.02.2025' },
  { id: 3, name: 'Ali Yılmaz', email: 'ali@mail.com', role: 'user', avatar: 'A', active: true, joinDate: '15.03.2025' },
  { id: 4, name: 'Selin K.', email: 'selin@mail.com', role: 'user', avatar: 'S', active: true, joinDate: '20.04.2025' },
  { id: 5, name: 'Mehmet T.', email: 'mehmet@mail.com', role: 'user', avatar: 'M', active: true, joinDate: '01.05.2025' },
];
