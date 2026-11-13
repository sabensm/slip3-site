// Renders an og-src/*.html card (1200x630) to PNG with WebKit.
// Usage (from the repo root; compiled because AppKit/WebKit do not link in `swift` script mode):
//   swiftc -O scripts/render-og.swift -o /tmp/render-og && /tmp/render-og og-src/slip3.html public/og/slip3.png
import AppKit
import WebKit
let args = CommandLine.arguments
let cwd = FileManager.default.currentDirectoryPath
let src = URL(fileURLWithPath: args[1]), out = args[2], access = URL(fileURLWithPath: cwd)
let app = NSApplication.shared
class D: NSObject, WKNavigationDelegate {
  func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
    w.evaluateJavaScript("document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>0))))") { _, _ in
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        let c = WKSnapshotConfiguration(); c.rect = CGRect(x: 0, y: 0, width: 1200, height: 630); c.snapshotWidth = 1200
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
let w = WKWebView(frame: CGRect(x: 0, y: 0, width: 1200, height: 630))
w.navigationDelegate = d
w.loadFileURL(src, allowingReadAccessTo: access)
DispatchQueue.main.asyncAfter(deadline: .now() + 30) { print("timeout"); exit(2) }
app.run()
