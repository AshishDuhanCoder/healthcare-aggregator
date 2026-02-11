import { HeartPulse, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border pt-16 pb-8">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">HealthAgg</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India's first neutral healthcare aggregator. Comparing doctors, labs, and medicines to bring you the best
              care at the best price.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  Doctor Search
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Lab Test Comparison
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Medicine Finder
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  AI Symptom Checker
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Partner with Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 HealthAgg Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-primary">
              Health Articles
            </Link>
            <Link href="#" className="hover:text-primary">
              Doctor FAQ
            </Link>
            <Link href="#" className="hover:text-primary">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
