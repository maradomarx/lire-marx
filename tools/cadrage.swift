// tools/cadrage.swift — où regarder dans chaque image des cartes.
//
// Pour chaque vignette de assets/img/cartes/, Vision (macOS) cherche les
// visages ; à défaut, la zone qui attire l'œil (saillance). On écrit une
// ligne par image : id, largeur, hauteur, F|S|N, puis la boîte retenue en
// fractions de l'image (centre x, centre y, largeur, hauteur, haut), origine
// en HAUT à gauche. tools/cartes.mjs (cadrage, build) en tire l'object-position
// de chaque carte. Pas une étape de build : on le relance quand des images
// changent, et l'on commite tools/cadrage.tsv.
//
//   swiftc -O tools/cadrage.swift -o /tmp/cadrage && /tmp/cadrage assets/img/cartes tools/cadrage.tsv
import Foundation
import Vision
import ImageIO

let dir = CommandLine.arguments[1]
let files = try! FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".webp") }.sorted()
func f3(_ x: CGFloat) -> String { String(format: "%.3f", Double(x)) }
var out: [String] = []
for f in files {
  let url = URL(fileURLWithPath: dir + "/" + f)
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
        let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
  let h = VNImageRequestHandler(cgImage: img, options: [:])
  let face = VNDetectFaceRectanglesRequest()
  let sal = VNGenerateAttentionBasedSaliencyImageRequest()
  try? h.perform([face, sal])
  var line = "\(f.dropLast(5))\t\(img.width)\t\(img.height)"
  // les visages nets ; s'il y en a plusieurs, on garde ceux qui comptent
  // (au moins 55 % de la hauteur du plus grand) et l'on cadre leur ensemble
  let faces = (face.results ?? []).filter { $0.confidence > 0.6 }
  var box: CGRect? = nil, k = "N"
  if !faces.isEmpty {
    let big = faces.map { $0.boundingBox.height }.max()!
    for r in faces where r.boundingBox.height > big * 0.55 { box = box?.union(r.boundingBox) ?? r.boundingBox }
    k = "F"
  } else if let s = (sal.results?.first as? VNSaliencyImageObservation)?.salientObjects, !s.isEmpty {
    for r in s { box = box?.union(r.boundingBox) ?? r.boundingBox }
    k = "S"
  }
  if let u = box { line += "\t\(k)\t\(f3(u.midX))\t\(f3(1 - u.midY))\t\(f3(u.width))\t\(f3(u.height))\t\(f3(1 - u.maxY))" }
  else { line += "\tN" }
  out.append(line)
}
try! (out.joined(separator: "\n") + "\n").write(toFile: CommandLine.arguments[2], atomically: true, encoding: .utf8)
print(out.count, "images")
