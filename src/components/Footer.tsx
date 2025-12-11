import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-white">WiseUp Shop</span>
            </Link>
            <p className="text-sm text-slate-400">
              Empowering shoppers to save money through community-driven price comparison
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Email</p>
                  <p className="text-sm text-slate-400">support@pricecompare.com</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Phone</p>
                  <p className="text-sm text-slate-400">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Office</p>
                  <p className="text-sm text-slate-400">123 Shopping Lane<br />San Francisco, CA 94102</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Business Hours</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Monday - Friday: 9AM - 6PM</li>
              <li>Saturday: 10AM - 4PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Wise-Up Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
