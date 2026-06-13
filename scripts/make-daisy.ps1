# 히어로용 데이지 에셋 생성: 크롭 + 검정 배경을 #0c0c0c로 리매핑 + PNG 저장
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Claude\pmo\public\_raw\ig_0011.jpg'
$outPath = 'C:\Claude\pmo\public\assets\brand\daisy.png'

$src = [System.Drawing.Image]::FromFile($srcPath)
$crop = New-Object System.Drawing.Rectangle(140, 220, 800, 800)
$bmp = New-Object System.Drawing.Bitmap(800, 800, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, 800, 800)), $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()

$rect = New-Object System.Drawing.Rectangle(0, 0, 800, 800)
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$len = [Math]::Abs($data.Stride) * 800
$bytes = New-Object 'byte[]' $len
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $len)
for ($i = 0; $i -lt $len; $i += 3) {
  if ($bytes[$i] -lt 26 -and $bytes[$i + 1] -lt 26 -and $bytes[$i + 2] -lt 26) {
    $bytes[$i] = 12; $bytes[$i + 1] = 12; $bytes[$i + 2] = 12
  }
}
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $len)
$bmp.UnlockBits($data)

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "saved: $outPath ($((Get-Item $outPath).Length) bytes)"
