// Renders an og-src/*.html layout to PNG with WebKit (1200x630 unless a width and height are given).
// Usage (from the repo root; compiled because AppKit/WebKit do not link in `swift` script mode):
//   swiftc -O scripts/render-og.swift -o /tmp/render-og && /tmp/render-og og-src/slip3.html public/og/slip3.png [width height]
import AppKit
import WebKit
let args = CommandLine.arguments
let cwd = FileManager.default.currentDirectoryPath
let src = URL(fileURLWithPath: args[1]), out = args[2], access = URL(fileURLWithPath: cwd)
let W = args.count > 4 ? Double(args[3])! : 1200, H = args.count > 4 ? Double(args[4])! : 630
let app = NSApplication.shared
class D: NSObject, WKNavigationDelegate {
  func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
    w.evaluateJavaScript("document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>0))))") { _, _ in
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        let c = WKSnapshotConfiguration(); c.rect = CGRect(x: 0, y: 0, width: W, height: H); c.snapshotWidth = NSNumber(value: W)
        w.takeSnapshot(with: c) { img, err in
          guard let img = img, let t = img.tiffRepresentation, let r = NSBitmapImageRep(data: t),
                let png = r.representation(using: .png, properties: [:]) else { print("fail \(String(describing: err))"); exit(1) }
          try! png.write(to: URL(fileURLWithPath: out)); print("ok"); exit(0)
        }
      }
    }
  }
}
let d = D()
let w = WKWebView(frame: CGRect(x: 0, y: 0, width: W, height: H))
w.navigationDelegate = d
w.loadFileURL(src, allowingReadAccessTo: access)
DispatchQueue.main.asyncAfter(deadline: .now() + 30) { print("timeout"); exit(2) }
app.run()
