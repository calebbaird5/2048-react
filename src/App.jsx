import './App.scss';
import { createRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ArrowKeysReact from 'arrow-keys-react';

function App() {
  const [score, setScore] = useState(0);
  const [easyMode, setEasyMode] = useState(false);
  const [slides, setSlides] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [nextSlideId, setNextSlideId] = useState(0);
  const [mergedLastMove, setMergedLastMove] = useState(false);
  // const [numRenders, setNumRenders] = useState(0);

  const values = [1,2,3,4];

  const toggleEasyMode = () => setEasyMode(!easyMode);

  const startNewGame = () => {
    setSlides([]);
    setNextSlideId(0);
    setScore(0);
    generateRandomSlides(2, []);
  };

  const generateRandomSlides = (numSlides = 1, _slides = slides) => {
    let _nextSlideId = nextSlideId + 0;
    for (let i = 0; i < numSlides; ++i) {
      let positions = availablePositions(_slides, values);
      if (positions.length === 0)
        setGameOver(true);
      else {
        _slides.push({
          value: Math.random() < .9 ? 2 : 4,
          id: _nextSlideId++,
          position: positions[Math.floor(Math.random()*positions.length)],
          nodeRef: createRef(null),
        });
      }
    }
    setNextSlideId(_nextSlideId);
    setSlides([..._slides]);
  };

  ArrowKeysReact.config({
    left: () => handleArrowKey({horizontal: true, increase: false}),
    right: () => handleArrowKey({horizontal: true, increase: true}),
    up: () => handleArrowKey({horizontal: false, increase: false}),
    down: () => handleArrowKey({horizontal: false, increase: true}),
  });

  const handleArrowKey = (slideProps) => {
    let newSlides = [];
    newSlides = slides.filter(slide => slide.merged === undefined);

    if (slideProps) {
      let {moved, merged, deltaScore} = slide(slideProps, newSlides, values);
      let mergedSlides = slides.filter(slide => slide.merged);
      for (let slide of mergedSlides) {
        let destSlide = slides.find(el => el.id === slide.merged);
        if (destSlide)
          slide.position = destSlide.position;
      }

      setSlides([...newSlides]);
      if (moved || merged || easyMode)
        generateRandomSlides(1, newSlides);

      setMergedLastMove(!!merged);
      setScore(score + deltaScore);
      // setNumRenders(numRenders + 1);
    }
  };

  return (
    <section className="_2048" {...ArrowKeysReact.events} tabIndex="1">
      <div className="header">
        <div className="title">2048</div>
        <div className="header-right">
          <div className="score">
            <span className="title">score</span>
            <span className="value">{score}</span>
          </div>
          <div className="controlls">
            <button onClick={startNewGame} className="new-game">New Game</button>
            <button
              onClick={toggleEasyMode}
              className={'easy-mode' + (easyMode ? ' active' : '')}
            > Easy Mode</button>
          </div>
        </div>
      </div>
      <div className="board">
        <div className="slots">
          { new Array(16).fill(null).map((el, i) => <div className="slot" key={i} ></div>) }
        </div>
        <TransitionGroup className="slides">
          { slides.map(slide =>
            <CSSTransition
              key={slide.id}
              nodeRef={slide.nodeRef}
              timeout={500}
              classNames="slide"
            >
              <div
                ref={slide.nodeRef}
                key={slide.id}
                className={
                  'slide'
                    + (slide.value > 2048 ? ' big' : ' _'+slide.value)
                    + (slide.merged ? ' merged' : '')
                    + ' x' + slide.position.x
                    + ' y' + slide.position.y
                }
              >{slide.value}</div>
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    </section>
  );
}

function availablePositions(slides, values) {
  let positions = [];

  for (let x of values) {
    for (let y of values) {
      if (!slides.find(slide =>
        slide.position.x === x && slide.position.y === y))
        positions.push({ x, y });
    }
  }

  return positions;
};



function slide(props, slides, values) {
  let deltaScore = 0;
  let _slides = slides.filter(slide => !slide.merged);
  let moved = false;
  let merged = false;
  let sliderDim = props.horizontal ? 'x' : 'y';
  for (let v of values) {
    let destination = props.increase ? 4 : 1;

    let slider;
    if (props.horizontal) {
      // Get the current row
      slider = _slides.filter(slide => slide.position.y === v);
    } else {
      // Get the current column
      slider = _slides.filter(slide => slide.position.x === v);
    }

    // Sort the slider
    let sorter = props.increase ?
        (l, r)=> l.position[sliderDim] < r.position[sliderDim] ? 1 : -1
        : (l, r)=> l.position[sliderDim] > r.position[sliderDim] ? 1 : -1;
    slider.sort(sorter);

    for (let i = 0; i < slider.length && slider[i]; ++i) {
      if (slider[i].position[sliderDim] !== destination) {
        moved = true;
        slider[i].position[sliderDim] = destination;
      }
      if (slider[i+1] && slider[i+1].value === slider[i].value) {
        merged = true;
        slider[i].value = slider[i+1].value *= 2;
        slider[i+1].merged = slider[i].id;
        deltaScore = deltaScore + slider[i].value;
        slider[i+1].position[sliderDim] = destination;
        i++; // I already took care of the next element so increment i;
      }
      destination = destination + (props.increase ? -1 : 1);
    }
  }
  return {moved, merged, deltaScore};
};

export default App;
