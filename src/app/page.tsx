'use client';

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { VolumeSlider } from '../components/VolumeSlider';

export default function Home() {
  const { onHover, onClick, onFocus } = useSoundEffects();

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
              <li className="nav-item"><Link className="nav-link" href="#made" onMouseEnter={onHover} onClick={onClick}>MADE</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#more" onMouseEnter={onHover} onClick={onClick}>MORE</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#blog" onMouseEnter={onHover} onClick={onClick}>BLOG</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#projects" onMouseEnter={onHover} onClick={onClick}>PROJECTS</Link></li>
              <li className="nav-item"><Link className="nav-link" href="#subscribe" onMouseEnter={onHover} onClick={onClick}>SUBSCRIBE</Link></li>
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
      <section className="page-section" id="about">
        <div className="container">
          <h2 className="section-title">ABOUT</h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <p className="lead text-center">Hi! Thank you for visiting my site. I&apos;m Aaron.</p>
              <p>I spend my days as a full-stack developer, creating innovative web solutions and exploring new technologies. I&apos;ve worked on various projects ranging from e-commerce platforms to data visualization tools.</p>
              <p>When I&apos;m not coding, I&apos;m either writing about technology, creating content, or working on my side projects. I believe in sharing knowledge and helping others learn.</p>
              <div className="highlights mt-4">
                <h3 className="h5 mb-3">Here are a few fun highlights:</h3>
                <ul>
                  <li>Built several successful web applications</li>
                  <li>Contributed to open-source projects</li>
                  <li>Created technical content that helps others learn</li>
                  <li>Worked with various technologies and frameworks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="page-section bg-light" id="projects">
        <div className="container">
          <h2 className="section-title text-center">PROJECTS</h2>
          <div className="row g-4">
            {/* Project Cards */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover}>
                <i className="fas fa-globe project-icon"></i>
                <h3 className="project-title">Sites Syndicate</h3>
                <p className="project-description">
                  Portfolio of my websites and web apps.
                </p>
                <div className="project-links">
                  {/* Add site links here if needed */}
                </div>
              </div>
            </div>
            {/* Extension Empire */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover}>
                <i className="fas fa-puzzle-piece project-icon"></i>
                <h3 className="project-title">Extension Empire</h3>
                <p className="project-description">
                  Browser extensions and automation tools.
                </p>
                <div className="project-links">
                  {/* Add extension links here if needed */}
                </div>
              </div>
            </div>
            {/* Sample Projects */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover}>
                <i className="fas fa-music project-icon"></i>
                <h3 className="project-title">Sample Projects</h3>
                <p className="project-description">
                  Mock up, sample projects, and scrapped ideas.
                </p>
                <div className="project-links">
                  <Link href="https://royalchat.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Royal Chat</Link>
                  <Link href="https://voicenoter.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Voice Noter</Link>
                  <Link href="https://createinc.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Create.Inc</Link>
                  <Link href="https://mock.hobedesignhouse.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Hobe Design House</Link>
                </div>
              </div>
            </div>
            {/* Academic Projects */}
            <div className="col-md-6 col-lg-4">
              <div className="project-card" onMouseEnter={onHover}>
                <i className="fas fa-laptop-code project-icon"></i>
                <h3 className="project-title">Academic Projects</h3>
                <p className="project-description">
                  Collection of web development and full-stack apps completed at Florida Atlantic University.
                </p>
                <div className="project-links">
                  {/* Internet Computing Projects */}
                  <Link href="https://internetcomputing.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Project 0</Link>
                  <Link href="https://internetcomputing.aaronmills.co/p1" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Project 1</Link>
                  <Link href="https://internetcomputing.aaronmills.co/p2" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Project 2</Link>
                  <Link href="https://internetcomputing.aaronmills.co/p3" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Project 3</Link>
                  <Link href="https://internetcomputing.aaronmills.co/p4" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Project 4</Link>
                  {/* Full-Stack Projects */}
                  <Link href="https://jpstudy.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>JP Study</Link>
                  <Link href="https://flashcards.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Flashcards</Link>
                  <Link href="https://flashcards2.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Flashcards 2</Link>
                  <Link href="https://catmaker.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Cat Maker</Link>
                  <Link href="https://recipes.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Recipes</Link>
                  <Link href="https://recipestatistics.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Recipe Stats</Link>
                  <Link href="https://characterparty.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Character Party</Link>
                  <Link href="https://preneurmanure.aaronmills.co" className="btn btn-sm btn-outline-primary" onMouseEnter={onHover} onClick={onClick}>Preneur Manure</Link>
                </div>
              </div>
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
