import { Trophy, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border bg-secondary text-secondary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">GolfGive</span>
          </div>
          <p className="text-sm text-secondary-foreground/60">
            Play golf. Win prizes. Change lives.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Platform</h4>
          <div className="flex flex-col gap-2 text-sm text-secondary-foreground/60">
            <Link to="/" className="hover:text-secondary-foreground transition-colors">How it Works</Link>
            <Link to="/charities" className="hover:text-secondary-foreground transition-colors">Charities</Link>
            <Link to="/register" className="hover:text-secondary-foreground transition-colors">Subscribe</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Legal</h4>
          <div className="flex flex-col gap-2 text-sm text-secondary-foreground/60">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Cookie Policy</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-secondary-foreground/60">
            <span>Help Center</span>
            <span>Contact Us</span>
            <span>FAQ</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-secondary-foreground/10 pt-6 text-center text-sm text-secondary-foreground/40">
        <p className="flex items-center justify-center gap-1">
          Made with <Heart className="h-3 w-3 text-destructive" /> for golfers & charities © 2026
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
