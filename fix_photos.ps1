# Script PowerShell - Fix vehicle photos in React files
# Lance avec: powershell -ExecutionPolicy Bypass -File fix_photos.ps1

$IMMAT = @"
const IMMAT_PHOTOS = {
  '240TN5082': 'https://i.ibb.co/FZmVWK6/vec1.jpg',
  '259TN5651': 'https://i.ibb.co/F4SbDBMM/vec2.jpg',
  '243TN1422': 'https://i.ibb.co/gbw2JtTH/vec3.jpg',
  '236TN5648': 'https://i.ibb.co/0RJ31jBB/vec4.jpg',
  '234TN2126': 'https://i.ibb.co/prkyKtjv/vec5.jpg',
  '244TN7005': 'https://i.ibb.co/P81vS80/vec6.jpg',
  '251TN1694': 'https://i.ibb.co/5WBKGTGL/vec7.jpg',
  '252TN3310': 'https://i.ibb.co/9kNtVZGB/vec8.png',
  '253TN4421': 'https://i.ibb.co/jvRzYcDB/vec9.png',
  '254TN6632': 'https://i.ibb.co/hxvysSY4/vec10.png',
  '255TN7743': 'https://i.ibb.co/dsfz2VnP/vec11.png',
  '256TN8854': 'https://i.ibb.co/35ccmkFY/vec12.jpg',
};
"@

$BASE = "C:\Users\Abdou\Desktop\waieb-car-rent\src\pages"

# ── Fix Reservations.jsx
$file1 = "$BASE\Reservations.jsx"
$content1 = Get-Content $file1 -Raw -Encoding UTF8
$old1 = "const getCarPhoto = (vehicle) => {`n  if (vehicle?.photo) return ``http://127.0.0.1:8000`${vehicle.photo}``;`n  return CAR_PHOTOS[(vehicle?.marque || '').toLowerCase()] || CAR_PHOTOS.default;`n};"
$new1 = $IMMAT + "const getCarPhoto = (vehicle) =>`n  IMMAT_PHOTOS[vehicle?.immatriculation] ||`n  (vehicle?.photo ? ``https://web-production-e6e97.up.railway.app`${vehicle.photo}`` : null) ||`n  CAR_PHOTOS[(vehicle?.marque || '').toLowerCase()] ||`n  CAR_PHOTOS.default;"
$content1 = $content1.Replace($old1, $new1)
Set-Content $file1 $content1 -Encoding UTF8
Write-Host "✅ Reservations.jsx fixed"

# ── Fix ReservationsList.jsx
$file2 = "$BASE\ReservationsList.jsx"
$content2 = Get-Content $file2 -Raw -Encoding UTF8
$old2 = "const getCarPhoto = (v) =>`n  v?.photo ? ``http://127.0.0.1:8000`${v.photo}`` : (CAR_PHOTOS[(v?.marque||'').toLowerCase()] || CAR_PHOTOS.default);"
$new2 = $IMMAT + "const getCarPhoto = (v) =>`n  IMMAT_PHOTOS[v?.immatriculation] ||`n  (v?.photo ? ``https://web-production-e6e97.up.railway.app`${v.photo}`` : null) ||`n  CAR_PHOTOS[(v?.marque||'').toLowerCase()] ||`n  CAR_PHOTOS.default;"
$content2 = $content2.Replace($old2, $new2)
Set-Content $file2 $content2 -Encoding UTF8
Write-Host "✅ ReservationsList.jsx fixed"

Write-Host "`n✅ Done! Now run:"
Write-Host "cd C:\Users\Abdou\Desktop\waieb-car-rent"
Write-Host "git add src/pages/Reservations.jsx src/pages/ReservationsList.jsx"
Write-Host "git commit -m `"fix: permanent vehicle photos in all pages`""
Write-Host "git push origin master"
