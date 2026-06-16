import React, { useState } from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  overflow-y: auto;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  @media (max-width: 700px) {
    width: 100vw;
    padding: 8px;
  }
`;

const OpeningPanel = styled(Panel)`
  height: 100vh;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const OpeningContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 48px);
  margin-bottom: 10px;
  text-align: center;
  font-weight: 600;
  font-family: Gadugi, Candara, 'Century Gothic', serif;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7b5fc9 0%, #6d5ebf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  @media (max-width: 700px) {
    font-size: 2rem;
    height: 60px;
  }
`;

const Subtitle = styled.h2`
  font-size: 18px;
  color: #34495e;
  margin: 20px 0 10px 0;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 15px;
  text-align: justify;
`;

const FunctionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FunctionItem = styled.li`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 20px;
  font-size: 12px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, background 0.2s;
  cursor: pointer;
  user-select: none;
  &:hover {
    transform: translateY(-2px) scale(1.04);
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }
`;

const NoSelection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 100px - 60px); /* leave space for title and footer */
  color: #7f8c8d;
  text-align: center;
`;

const NoSelectionIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const NoSelectionText = styled.p`
  font-size: 16px;
  line-height: 1.5;
`;

const ColorIndicator = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: inline-block;
  margin-right: 10px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const RegionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(240,240,240,0.85);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(44, 62, 80, 0.25);
  padding: 32px 28px 24px 28px;
  width: clamp(300px, 40vw, 500px);
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  z-index: 10000;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 18px;
  text-align: center;
`;

const ArticleList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ArticleItem = styled.li`
  margin-bottom: 14px;
  font-size: 15px;
  a {
    color: #2980b9;
    text-decoration: none;
    font-weight: 500;
    &:hover {
      text-decoration: underline;
      color: #764ba2;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 22px;
  color: #888;
  cursor: pointer;
  &:hover {
    color: #e74c3c;
  }
`;

// Scholar fetch function
async function fetchScholarArticles(regionName, func) {
  const query = `${regionName} ${func}`;
  const encodedQuery = encodeURIComponent(query);
  const lastYear = new Date().getFullYear() - 1;

  return [
    {
      title: `Most Relevant Research Articles: ${regionName} ${func}`,
      url: `https://scholar.google.com/scholar?q=${encodedQuery}`
    },
    {
      title: `Most Recent Research Articles (Last Year): ${regionName} ${func}`,
      url: `https://scholar.google.com/scholar?q=${encodedQuery}&as_ylo=${lastYear}&sort=date`
    },
    {
      title: `Most Relevant Reviews: ${regionName} ${func}`,
      url: `https://scholar.google.com/scholar?q=${encodedQuery}+review`
    }
  ];
}

const Footer = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 40px;
  margin-bottom: 10px;
`;

const FooterText = styled.p`
  font-style: italic;
  color: #888;
  font-size: 15px;
`;

const FooterLink = styled.a`
  color: #7b5fc9;
  text-decoration: underline;
  font-style: italic;
  &:hover {
    color: #6d5ebf;
  }
`;

const GitHubIcon = styled.a`
  color: #7b5fc9;
  text-decoration: none;
  margin-left: 8px;
  display: inline-block;
  transition: transform 0.2s ease;
  vertical-align: middle;
  &:hover {
    transform: scale(1.1);
  }
  img {
    width: 16px;
    height: 16px;
    vertical-align: middle;
  }
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const LargeGitHubIcon = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px auto 0 auto;
  width: 48px;
  height: 48px;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
  img {
    width: 48px;
    height: 48px;
    vertical-align: middle;
  }
`;

const NoSelectionSpaced = styled(NoSelection)`
  margin-bottom: 48px;
`;

const UnifiedPanel = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  @media (max-width: 700px) {
    width: 100vw;
    padding: 8px;
  }
`;

const UnifiedHeader = styled.div`
  flex: 0 0 auto;
  padding-top: 32px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const UnifiedContent = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const UnifiedFooter = styled(Footer)`
  flex: 0 0 auto;
  margin-top: 0;
  margin-bottom: 12px;
`;

const InfoPanel = ({ selectedRegion }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFunction, setModalFunction] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug: Log selectedRegion.functions before rendering
  if (selectedRegion) {
    console.log('selectedRegion.functions:', selectedRegion.functions);
  }

  const handleFunctionClick = async (func) => {
    console.log('Clicked function:', func); // Debug: Log click event
    setModalFunction(func);
    setModalOpen(true);
    setLoading(true);
    if (selectedRegion) {
      try {
        const articles = await fetchScholarArticles(selectedRegion.name, func);
        setArticles(articles);
      } catch (error) {
        console.error('Error fetching scholar articles:', error);
      }
    }
    setLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalFunction('');
    setArticles([]);
  };

  return (
    <UnifiedPanel>
      <UnifiedHeader>
        <Title>3D Brain</Title>
      </UnifiedHeader>
      <UnifiedContent>
        {!selectedRegion ? (
          <NoSelectionSpaced>
            <NoSelectionIcon>🧠</NoSelectionIcon>
            <NoSelectionText>
              Click on any brain region to learn more about its structure and functions.
              <br /><br />
              Use your mouse to rotate, zoom, and explore the 3D brain model.
            </NoSelectionText>
          </NoSelectionSpaced>
        ) : (
          <>
            <RegionHeader>
              <ColorIndicator color={selectedRegion.color} />
              <Subtitle>{selectedRegion.name}</Subtitle>
            </RegionHeader>
            <Description>{selectedRegion.description}</Description>
            <Subtitle>Key Functions</Subtitle>
            <FunctionList>
              {selectedRegion.functions.map((func, index) => (
                <FunctionItem key={index} onClick={() => handleFunctionClick(func)}>
                  {func}
                </FunctionItem>
              ))}
            </FunctionList>
            <Subtitle>Interactive Features</Subtitle>
            <Description>
              • Click and drag to rotate the brain<br />
              • Scroll to zoom in and out<br />
              • Hover over regions to highlight them<br />
              • Click regions to view detailed information
            </Description>
            {modalOpen && (
              <ModalOverlay onClick={closeModal}>
                <ModalBox onClick={e => e.stopPropagation()}>
                  <CloseButton onClick={closeModal} title="Close">×</CloseButton>
                  <ModalTitle>Google Scholar Search Results: <br /><span style={{fontWeight:400}}>{selectedRegion.name} – {modalFunction}</span></ModalTitle>
                  {loading ? (
                    <Description>Loading articles...</Description>
                  ) : (
                    <>
                      <Description style={{marginBottom: '15px', fontSize: '13px', color: '#666'}}>
                        Click any link below to search Google Scholar for research papers about this brain region and function.
                      </Description>
                      <ArticleList>
                        {articles.map((article, idx) => (
                          <ArticleItem key={idx}>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              {article.title}
                            </a>
                          </ArticleItem>
                        ))}
                      </ArticleList>
                    </>
                  )}
                </ModalBox>
              </ModalOverlay>
            )}
          </>
        )}
      </UnifiedContent>
      <UnifiedFooter>
        <FooterText>
          <FooterContent>
            Created by <FooterLink href="https://www.linkedin.com/in/emre-yorganc%C4%B1gil-md-phd-14a17780/" target="_blank" rel="noopener noreferrer">Emre Yorgancıgil</FooterLink>, 2025
          </FooterContent>
          <LargeGitHubIcon href="https://github.com/EmreML/3D-BrainMap" target="_blank" rel="noopener noreferrer" title="GitHub Repository">
            <img src="/GitHub-logo-1536x864.png" alt="GitHub" />
          </LargeGitHubIcon>
        </FooterText>
      </UnifiedFooter>
    </UnifiedPanel>
  );
};

export default InfoPanel; 
