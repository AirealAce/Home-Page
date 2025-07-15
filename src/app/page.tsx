'use client';

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { VolumeSlider } from '../components/VolumeSlider';
import { useState } from 'react';

// Paginated Project Card Component
const PaginatedProjectCard = ({ 
  icon, 
  title, 
  description, 
  links, 
  onHover, 
  onClick 
}: {
  icon: string;
  title: string;
  description: string;
  links: { href: string; text: string }[];
  onHover: () => void;
  onClick: () => void;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const linksPerPage = 6;
  const totalPages = Math.ceil(links.length / linksPerPage);
  
  const startIndex = currentPage * linksPerPage;
  const endIndex = startIndex + linksPerPage;
  const currentLinks = links.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="project-card" onMouseEnter={onHover} style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <i className={`${icon} project-icon`}></i>
      <h3 className="project-title">{title}</h3>
      <p className="project-description">{description}</p>
      <div className="project-links" style={{ minHeight: '120px', flex: '1' }}>
        {currentLinks.map((link, index) => (
          <Link 
            key={index}
            href={link.href} 
            className="btn btn-sm btn-outline-primary" 
            style={{
              minWidth: '80px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem'
            }}
            onMouseEnter={onHover} 
            onClick={onClick}
          >
            {link.text}
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination-controls" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem', 
          marginTop: '1rem' 
        }}>
          <button 
            onClick={prevPage} 
            disabled={currentPage === 0}
            className="btn btn-sm"
            style={{ 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #8B0000',
              backgroundColor: 'transparent',
              color: '#8B0000',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              onHover();
              e.currentTarget.style.backgroundColor = '#8B0000';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8B0000';
            }}
          >
            ←
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            {currentPage + 1} / {totalPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages - 1}
            className="btn btn-sm"
            style={{ 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #8B0000',
              backgroundColor: 'transparent',
              color: '#8B0000',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              onHover();
              e.currentTarget.style.backgroundColor = '#8B0000';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8B0000';
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const { onHover, onClick } = useSoundEffects();

  return (
    <>

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light fixed-top">
        <div className="container">
          <Link href="#page-top" className="navbar-brand" onMouseEnter={onHover} onClick={onClick}>AARON | MILLS</Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarResponsive" 
            onMouseEnter={onHover} 
            onClick={onClick}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarResponsive">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <VolumeSlider />
              </li>
              <li className="nav-item"><Link className="nav-link" href="#about" onMouseEnter={onHover} onClick={onClick}>ABOUT</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#services" onMouseEnter={onHover} onClick={onClick}>SERVICES</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#projects" onMouseEnter={onHover} onClick={onClick}>PROJECTS</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#contact" onMouseEnter={onHover} onClick={onClick}>CONTACT</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
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
          <h1 className="display-4 mb-4 text-white">hi, I&apos;m aaron</h1>
          <div className="brands-section mt-5">
            <p className="text-muted mb-4">As seen in:</p>
            <div className="row justify-content-center align-items-center">
              <div className="col-auto">
                <a href="https://x.com/aaronmiruzu" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onMouseEnter={onHover} onClick={onClick}>
                  <FontAwesomeIcon 
                    icon={faTwitter} 
                    size="2x" 
                    style={{ color: '#1DA1F2' }} 
                  />
                </a>
              </div>
              <div className="col-auto">
                <a href="https://github.com/AirealAce" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onMouseEnter={onHover} onClick={onClick}>
                  <FontAwesomeIcon 
                    icon={faGithub} 
                    size="2x" 
                    style={{ color: '#ffffff' }} 
                  />
                </a>
              </div>
              <div className="col-auto">
                <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} onMouseEnter={onHover} onClick={onClick}>
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
      <section className="page-section" id="about" style={{ backgroundColor: '#d0d0d0', color: '#333' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: '#333' }}>ABOUT</h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <p className="lead text-center" style={{ color: '#333' }}>Hi! Thank you for visiting my site. I&apos;m Aaron.</p>
              <p style={{ color: '#333' }}>I spend my days vibe coding, creating innovative web applications and exploring valuable AI technologies. I&apos;ve worked on various projects ranging from automation workflows to browser extensions.</p>
              <p style={{ color: '#333' }}>When I&apos;m not coding, I&apos;m either writing about technology, creating content, or working on my side projects. I believe in sharing knowledge and helping others learn.</p>
              <div className="highlights mt-4" style={{ backgroundColor: '#c0c0c0', padding: '2rem', borderRadius: '10px', border: '2px solid #dee2e6' }}>
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

      {/* Services Section */}
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
          <div className="row g-4">
            {/* Automation Agentic Systems */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={onHover}>
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
            {/* Mockups */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={onHover}>
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
            {/* Web Apps */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={onHover}>
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
            {/* Extensions */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={onHover}>
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
            {/* Bots */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" style={{ backgroundColor: '#1a1a1a', border: '2px solid #2c3e50', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={onHover}>
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

      {/* Projects Section */}
      <section className="page-section" id="projects" style={{ backgroundColor: '#d0d0d0' }}>
        <div className="container">
          <h2 className="section-title text-center">PROJECTS</h2>
          <div className="row g-4">
            {/* Project Cards */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover} style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <i className="fas fa-globe project-icon"></i>
                <h3 className="project-title">Sites Syndicate</h3>
                <p className="project-description">
                  Portfolio of my websites and web apps.
                </p>
                <div className="project-links" style={{ minHeight: '120px', alignContent: 'flex-start' }}>
                  {/* Add site links here if needed */}
                  <Link 
                    href="https://habithall.com" 
                    className="btn btn-sm btn-outline-primary" 
                    style={{
                      minWidth: '80px',
                      height: '32px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem'
                    }}
                    onMouseEnter={onHover} 
                    onClick={onClick}
                  >
                    Habit Hall
                  </Link>
                  <Link 
                    href="https://insertsight.com" 
                    className="btn btn-sm btn-outline-primary" 
                    style={{
                      minWidth: '80px',
                      height: '32px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem'
                    }}
                    onMouseEnter={onHover} 
                    onClick={onClick}
                  >
                    Insert Sight
                  </Link>
                </div>
              </div>
            </div>
            {/* Extension Empire */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover} style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <i className="fas fa-puzzle-piece project-icon"></i>
                <h3 className="project-title">Extension Empire</h3>
                <p className="project-description">
                  Browser extensions and automation tools.
                </p>
                <div className="project-links" style={{ flex: '1', alignContent: 'flex-start', minHeight: '120px' }}>
                  {/* Add extension links here if needed */}
                </div>
              </div>
            </div>
            {/* Sample Projects */}
            <div className="col-md-6 col-lg-4">
              <PaginatedProjectCard
                icon="fas fa-music"
                title="Sample Projects"
                description="Mock up, sample projects, and scrapped ideas."
                links={[
                  { href: "https://royalchat.aaronmills.co", text: "Royal Chat" },
                  { href: "https://voicenoter.aaronmills.co", text: "Voice Noter" },
                  { href: "https://createinc.aaronmills.co", text: "Create.Inc" },
                  { href: "https://mock.hobedesignhouse.aaronmills.co", text: "Hobe Design House" },
                  { href: "https://demo-jump-game.aaronmills.co", text: "Demo Game" },
                  { href: "https://kawaiistudio.aaronmills.co", text: "KawaiiStudio" },
                  { href: "https://sonicmon.aaronmills.co", text: "Sonimon" },
                  { href: "https://translator.aaronmills.co", text: "Translator" },
                  { href: "https://spritesaga.aaronmills.co", text: "Sprite Saga" }
                ]}
                onHover={onHover}
                onClick={onClick}
              />
            </div>
            {/* Academic Projects */}
            <div className="col-md-6 col-lg-4">
              <PaginatedProjectCard
                icon="fas fa-laptop-code"
                title="Academic Projects"
                description="Collection of web development and full-stack apps completed at Florida Atlantic University."
                links={[
                  { href: "https://internetcomputing.aaronmills.co", text: "Project 0" },
                  { href: "https://internetcomputing.aaronmills.co/p1", text: "Project 1" },
                  { href: "https://internetcomputing.aaronmills.co/p2", text: "Project 2" },
                  { href: "https://internetcomputing.aaronmills.co/p3", text: "Project 3" },
                  { href: "https://internetcomputing.aaronmills.co/p4", text: "Project 4" },
                  { href: "https://jpstudy.aaronmills.co", text: "JP Study" },
                  { href: "https://flashcards.aaronmills.co", text: "Flashcards" },
                  { href: "https://flashcards2.aaronmills.co", text: "Flashcards 2" },
                  { href: "https://catmaker.aaronmills.co", text: "Cat Maker" },
                  { href: "https://recipes.aaronmills.co", text: "Recipes" },
                  { href: "https://recipestatistics.aaronmills.co", text: "Recipe Stats" },
                  { href: "https://characterparty.aaronmills.co", text: "Character Party" },
                  { href: "https://preneurmanure.aaronmills.co", text: "Preneur Manure" }
                ]}
                onHover={onHover}
                onClick={onClick}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="social-links">
            <a href="https://x.com/aaronmiruzu" className="social-icon" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="https://github.com/AirealAce" className="social-icon" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a href="https://www.linkedin.com/feed/" className="social-icon" target="_blank" rel="noopener noreferrer" onMouseEnter={onHover} onClick={onClick}>
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
          </div>
          <p className="text-center mt-4">© 2024 Aaron Mills. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
