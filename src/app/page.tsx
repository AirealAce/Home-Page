'use client';

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { VolumeSlider } from '../components/VolumeSlider';
import { ProfileAnimationCanvas, type ProfileCanvasMode } from '@/components/ProfileAnimationCanvas';
import { SiteSearch } from '@/components/SiteSearch';
import { entryId, projectCards, writingCards, writingsPerPage, type ContentCard, type SiteSection } from '@/data/siteContent';
import { createSearchEntries, type SearchEntry } from '@/utils/siteSearch';
import { useEffect, useRef, useState } from 'react';

// A single content list supplies both the cards and the header search.
const ProjectCard = ({ card, currentPage, onPageChange, onHover, onClick }: {
  card: ContentCard;
  currentPage: number;
  onPageChange: (page: number) => void;
  onHover: () => void;
  onClick: () => void;
}) => {
  const linksPerPage = card.linksPerPage ?? Math.max(card.links.length, 1);
  const totalPages = Math.max(1, Math.ceil(card.links.length / linksPerPage));
  const page = Math.min(currentPage, totalPages - 1);
  const currentLinks = card.links.slice(page * linksPerPage, (page + 1) * linksPerPage);

  return (
    <div className="project-card" style={{ backgroundColor: '#d8d8d8', color: '#333', height: '340px', display: 'flex', flexDirection: 'column' }}>
      <i className={`${card.icon} project-icon`}></i>
      <h3 className="project-title">{card.title}</h3>
      <p className="project-description" style={{ color: '#666' }}>{card.description}</p>
      <div className="project-links" style={{ flex: '1', ...(card.linksPerPage ? { minHeight: '100px' } : {}) }}>
        {currentLinks.map(link => (
          <Link
            key={link.id}
            id={entryId('projects', card.id, link.id)}
            href={link.href}
            className="btn btn-sm btn-outline-primary"
            style={{
              backgroundColor: '#000', color: '#6ea8fe',
              ...(card.linksPerPage ? {
                minWidth: '80px', height: '32px', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', padding: '0.25rem 0.5rem'
              } : {})
            }}
            onMouseEnter={onHover}
            onClick={onClick}
          >{link.text}</Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="project-carousel-button" aria-label={`Previous ${card.title} buttons`}
            disabled={page === 0} onMouseEnter={onHover}
            onClick={() => { onClick(); onPageChange(page - 1); }}>←</button>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{page + 1} / {totalPages}</span>
          <button type="button" className="project-carousel-button" aria-label={`Next ${card.title} buttons`}
            disabled={page === totalPages - 1} onMouseEnter={onHover}
            onClick={() => { onClick(); onPageChange(page + 1); }}>→</button>
        </div>
      )}
    </div>
  );
};

const searchEntries = createSearchEntries(projectCards, writingCards);
const profileAnimationOptions = ['meteors', 'lightning', 'blue-fire'] as const;
type ProfileAnimation = typeof profileAnimationOptions[number];

export default function Home() {
  const { onHover, onClick } = useSoundEffects();
  const [isAlternateLayout, setIsAlternateLayout] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [projectPages, setProjectPages] = useState<Record<string, number>>({});
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [animationReady, setAnimationReady] = useState(false);
  const [profileAnimation, setProfileAnimation] = useState<ProfileAnimation>('meteors');
  const [writingsPage, setWritingsPage] = useState(0);
  const writingsPageCount = Math.ceil(writingCards.length / writingsPerPage);
  const visibleWritingCards = writingCards.slice(
    writingsPage * writingsPerPage,
    (writingsPage + 1) * writingsPerPage
  );
  const hasWritingsCarousel = writingCards.length > writingsPerPage;
  const activeProfileAnimation = animationReady && animationsEnabled ? profileAnimation : null;
  const activeCanvasAnimation: ProfileCanvasMode = activeProfileAnimation === 'lightning' || activeProfileAnimation === 'blue-fire'
    ? activeProfileAnimation
    : null;

  const locateEntry = (entry: SearchEntry) => {
    if (entry.sectionId === 'writings') setWritingsPage(entry.cardPage);
    else setProjectPages(pages => ({ ...pages, [entry.cardId]: entry.linkPage }));
    setIsMenuOpen(false);
    setPendingTarget(entry.id);
  };

  const locateSection = (section: SiteSection) => {
    setIsMenuOpen(false);
    setPendingTarget(section.id);
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeaderHeight = () => document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Pagination has committed before focus moves, so off-page buttons are real targets.
  useEffect(() => {
    if (!pendingTarget) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(pendingTarget);
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: pendingTarget.startsWith('entry-') ? 'center' : 'start'
        });
      }
      setPendingTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingTarget]);

  useEffect(() => {
    const savedAnimationPreference = window.localStorage.getItem('profileAnimationsEnabled');
    setAnimationsEnabled(savedAnimationPreference !== 'false');
    const randomAnimationIndex = Math.floor(Math.random() * profileAnimationOptions.length);
    setProfileAnimation(profileAnimationOptions[randomAnimationIndex]);
    setAnimationReady(true);
  }, []);

  return (
    <div id="page-top" className={`site-layout ${isAlternateLayout ? 'layout-one' : 'layout-two'}`}>
      {/* Navigation */}
      <nav ref={headerRef} className="navbar navbar-expand-xl navbar-light fixed-top">
        <div className="container">
          <Link href="#page-top" className="navbar-brand" onMouseEnter={onHover} onClick={onClick}>AARON | MILLS</Link>
          <SiteSearch entries={searchEntries} onLocateEntry={locateEntry} onLocateSection={locateSection} />
          <button 
            className="navbar-toggler" 
            type="button" 
            aria-label="Toggle navigation"
            aria-controls="navbarResponsive"
            aria-expanded={isMenuOpen}
            onMouseEnter={onHover} 
            onClick={() => { onClick(); setIsMenuOpen(open => !open); }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse${isMenuOpen ? ' show' : ''}`} id="navbarResponsive">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item animation-nav-item">
                <button
                  type="button"
                  className={`animation-toggle-button${animationsEnabled ? '' : ' is-off'}`}
                  aria-label={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
                  aria-pressed={animationsEnabled}
                  title={animationsEnabled ? 'Turn animations off' : 'Turn animations on'}
                  onMouseEnter={onHover}
                  onClick={() => {
                    onClick();
                    setAnimationsEnabled(currentValue => {
                      const nextValue = !currentValue;
                      window.localStorage.setItem('profileAnimationsEnabled', String(nextValue));
                      return nextValue;
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                </button>
              </li>
              <li className="nav-item volume-nav-item">
                <VolumeSlider />
              </li>
              <li className="nav-item"><Link className="nav-link" href="#about" onMouseEnter={onHover} onClick={onClick}>ABOUT</Link></li>
              {/* <li className="nav-item"><Link className="nav-link" href="#services" onMouseEnter={onHover} onClick={onClick}>SERVICES</Link></li> */}
              <li className="nav-item"><Link className="nav-link" href="#projects" onMouseEnter={onHover} onClick={onClick}>PROJECTS</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#writings" onMouseEnter={onHover} onClick={onClick}>WRITINGS</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#contact" onMouseEnter={onHover} onClick={onClick}>CONTACT</Link></li>
              <li className="nav-item layout-toggle-nav-item">
                <button
                  type="button"
                  className="nav-link layout-toggle-button"
                  aria-pressed={isAlternateLayout}
                  aria-label={`Switch to layout ${isAlternateLayout ? 'one' : 'two'}`}
                  title={`Switch to layout ${isAlternateLayout ? 'one' : 'two'}`}
                  onMouseEnter={onHover}
                  onClick={() => {
                    onClick();
                    setIsAlternateLayout(currentLayout => !currentLayout);
                  }}
                >
                  LAYOUT {isAlternateLayout ? '1' : '2'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="profile-about-layout">
        {/* Hero Section */}
        <section className="hero-section" id="profile" tabIndex={-1} aria-label="Profile">
        <div className={`profile-animation-layer profile-meteor-shower${activeProfileAnimation === 'meteors' ? ' is-active' : ''}`} aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span className="profile-meteor" key={index}></span>
          ))}
        </div>
        <ProfileAnimationCanvas mode={activeCanvasAnimation} />
        <div className="container">
          <Image 
            className="profile-image" 
            src="/images/Aaron.jpg"
            alt="Aaron Mills" 
            width={400}
            height={400}
            priority
            quality={100}
            style={{
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
          <h1 className="display-4 mb-3 text-white">hi, I&apos;m aaron</h1>
          <div className="brands-section mt-3">
            <p className="text-muted mb-3">As seen in:</p>
            <div className="row justify-content-center align-items-center">
              <div className="col-auto">
                <a href="https://x.com/aaronmiruzu" className="hero-social-icon" aria-label="Twitter" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
                  <FontAwesomeIcon 
                    icon={faTwitter} 
                    size="2x" 
                    style={{ color: '#1DA1F2' }} 
                  />
                </a>
              </div>
              <div className="col-auto">
                <a href="https://github.com/AirealAce" className="hero-social-icon" aria-label="GitHub" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
                  <FontAwesomeIcon 
                    icon={faGithub} 
                    size="2x" 
                    style={{ color: '#ffffff' }} 
                  />
                </a>
              </div>
              <div className="col-auto">
                <a href="https://www.linkedin.com/feed/" className="hero-social-icon" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
                  <FontAwesomeIcon 
                    icon={faLinkedin} 
                    size="2x" 
                    style={{ color: '#0077B5' }} 
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* About Section */}
        <section className="page-section" id="about" tabIndex={-1} aria-label="About" style={{ backgroundColor: '#d8d8d8', color: '#333' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: '#333' }}>ABOUT</h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <p className="lead text-center" style={{ color: '#333' }}>Hi! Thank you for visiting my site. I&apos;m Aaron.</p>
              <p style={{ color: '#333' }}>I spend my days vibe coding, creating innovative web applications and exploring valuable AI technologies. I&apos;ve worked on various projects ranging from automation workflows to browser extensions.</p>
              <p style={{ color: '#333' }}>When I&apos;m not coding, I&apos;m either writing about technology, creating content, or working on my side projects. I believe in sharing knowledge and helping others learn.</p>
              <div className="highlights mt-3" style={{ backgroundColor: '#c0c0c0', padding: '1.25rem', borderRadius: '10px', border: '2px solid #dee2e6' }}>
                <h3 className="h5 mb-3" style={{ color: '#333' }}>Here are a few fun highlights:</h3>
                <ul style={{ color: '#333' }}>
                  <li>Built several web applications</li>
                  <li>Created technical content that helps others learn</li>
                  <li>Worked with various AI technologies and frameworks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      {/* Services Section
      <section className="page-section" id="services" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ color: '#fff' }}>SERVICES</h2>
          <div className="row justify-content-center mb-2">
            <div className="col-lg-8">
              <p className="lead text-center" style={{ color: '#fff' }}>
                I offer elegantly packaged digital solutions for individuals and businesses, which range from automation agentic systems to mock ups, web apps, extensions, and bots.
              </p>
              <p className="text-center" style={{ color: '#fff', fontStyle: 'italic', marginTop: '1rem' }}>
                If interested, DM me <a href="https://x.com/aaronmiruzu" target="_blank" rel="noopener noreferrer" style={{ color: '#1DA1F2', textDecoration: 'none' }} onMouseEnter={onHover} onClick={onClick}>here on X.</a>
              </p>
            </div>
          </div>
          <div className="row g-3 justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: '1' }}>
                  <i className="fas fa-robot project-icon" style={{ color: '#1abc9c' }}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>Automation Systems</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    Intelligent automation solutions that streamline workflows and boost productivity for businesses.
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  style={{ 
                    borderRadius: '25px', 
                    marginTop: 'auto', 
                    marginBottom: '0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={onHover} 
                  onClick={onClick}
                >
                  $1 each
                </button>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: '1' }}>
                  <i className="fas fa-palette project-icon" style={{ color: '#1abc9c' }}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>Mockups</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    Professional design mockups and prototypes to visualize your ideas before development.
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  style={{ 
                    borderRadius: '25px', 
                    marginTop: 'auto', 
                    marginBottom: '0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={onHover} 
                  onClick={onClick}
                >
                  $1 each
                </button>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: '1' }}>
                  <i className="fas fa-globe project-icon" style={{ color: '#1abc9c' }}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>Web Apps</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    Custom web applications built with modern technologies and best practices.
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  style={{ 
                    borderRadius: '25px', 
                    marginTop: 'auto', 
                    marginBottom: '0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={onHover} 
                  onClick={onClick}
                >
                  $1 each
                </button>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: '1' }}>
                  <i className="fas fa-puzzle-piece project-icon" style={{ color: '#1abc9c' }}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>Extensions</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    Browser extensions and add-ons that enhance functionality and user experience.
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  style={{ 
                    borderRadius: '25px', 
                    marginTop: 'auto', 
                    marginBottom: '0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={onHover} 
                  onClick={onClick}
                >
                  $1 each
                </button>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: '1' }}>
                  <i className="fas fa-comments project-icon" style={{ color: '#1abc9c' }}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>Bots</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    Intelligent chatbots and automation bots for customer service and process automation.
                  </p>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success" 
                  style={{ 
                    borderRadius: '25px', 
                    marginTop: 'auto', 
                    marginBottom: '0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={onHover} 
                  onClick={onClick}
                >
                  $1 each
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Projects Section */}
      <section className="page-section" id="projects" tabIndex={-1} aria-label="Projects" style={{ backgroundColor: '#000', color: '#fff' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ color: '#fff' }}>PROJECTS</h2>
          <div className="row g-3 justify-content-center">
            {projectCards.filter(card => card.keepVisible || card.links.length > 0).map(card => (
              <div className="col-md-6 col-lg-4" key={card.id} data-keep-visible={card.keepVisible || undefined}>
                <ProjectCard
                  card={card}
                  currentPage={projectPages[card.id] ?? 0}
                  onPageChange={page => setProjectPages(pages => ({ ...pages, [card.id]: page }))}
                  onHover={onHover}
                  onClick={onClick}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Writings Section */}
      <section className="page-section" id="writings" tabIndex={-1} aria-label="Writings" style={{ backgroundColor: '#d8d8d8', color: '#333' }}>
        <div className="container">
          <div className={`writings-section-header${hasWritingsCarousel ? '' : ' without-controls'}`}>
            {hasWritingsCarousel && (
              <button
                type="button"
                className="writings-carousel-button"
                aria-label="Previous writing cards"
                disabled={writingsPage === 0}
                onMouseEnter={onHover}
                onClick={() => {
                  onClick();
                  setWritingsPage(page => Math.max(0, page - 1));
                }}
              >
                ←
              </button>
            )}
            <h2 className="section-title text-center" style={{ color: '#333' }}>WRITINGS</h2>
            {hasWritingsCarousel && (
              <button
                type="button"
                className="writings-carousel-button"
                aria-label="Next writing cards"
                disabled={writingsPage === writingsPageCount - 1}
                onMouseEnter={onHover}
                onClick={() => {
                  onClick();
                  setWritingsPage(page => Math.min(writingsPageCount - 1, page + 1));
                }}
              >
                →
              </button>
            )}
          </div>
          <div className="row g-3 justify-content-center">
            {visibleWritingCards.map(card => (
              <div className="col-md-6 col-lg-4" key={card.id}>
                <div className="project-card writing-card" style={{ backgroundColor: '#000', color: '#fff', height: 'auto', minHeight: '340px', maxHeight: '680px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <i className={`${card.icon} project-icon`}></i>
                  <h3 className="project-title" style={{ color: '#fff' }}>{card.title}</h3>
                  <p className="project-description" style={{ color: '#adb5bd' }}>
                    {card.description}
                  </p>
                  <div className="project-links" style={{ flex: '1' }}>
                    {card.links.map(link => (
                      <Link key={link.id} id={entryId('writings', card.id, link.id)} href={link.href}
                        className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>
                        {link.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact" tabIndex={-1} aria-label="Contact">
        <div className="container">
          <div className="social-links">
            <a href="https://x.com/aaronmiruzu" className="social-icon social-icon-twitter" aria-label="Twitter" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="https://github.com/AirealAce" className="social-icon social-icon-github" aria-label="GitHub" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a href="https://www.linkedin.com/feed/" className="social-icon social-icon-linkedin" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
          </div>
          <p className="text-center mt-3">© 2024 Aaron Mills. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
