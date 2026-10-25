import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import './style.css';

const fullName = 'Stacy Brigitte Valenzuela Rios';
function App() {
  const [step, setStep] = useState(0);
  const [sound, setSound] = useState(false);
  const [burst, setBurst] = useState(0);
  function chime() {
    if (!sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      [523.25,659.25,783.99].forEach((hz,i) => {
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=hz;
        gain.gain.setValueAtTime(0,ctx.currentTime+i*.09);
        gain.gain.linearRampToValueAtTime(.07,ctx.currentTime+i*.09+.02);
        gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.09+.5);
        osc.start(ctx.currentTime+i*.09);osc.stop(ctx.currentTime+i*.09+.5);
      });
      setTimeout(()=>ctx.close(),1100);
    } catch {}
  }
  function next(){chime();setStep(s=>Math.min(s+1,3));setBurst(b=>b+1);}
  return <div className="site-shell">
    <header><a className="wordmark" href="#" onClick={e=>{e.preventDefault();setStep(0)}} aria-label="Volver al inicio">s<span className="wordmark-star">✳</span><span>birthday studio</span></a><div className="header-right"><span className="date">30 OCT / 2026</span><button className="sound" onClick={()=>setSound(!sound)} aria-label={sound?'Desactivar sonido':'Activar sonido'}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></div></header>
    <main>
      <section className="intro"><div className="eyebrow"><span/> UNA SOLA FECHA. TODA UNA CELEBRACIÓN.</div><h1>Hoy el mundo<br/>dice <em>Stacy.</em><span className="title-spark">✳</span></h1><p className="intro-copy">21 años merecen algo fuera de lo común.<br/>Esta pequeña sorpresa lleva tu nombre.</p><div className="recipient"><span className="recipient-line"/><span>PARA <strong>{fullName}</strong></span></div></section>
      <section className={'experience stage-'+step} aria-label="Sorpresa de cumpleaños">
        <div className="panel-top"><span>EDICIÓN LIMITADA</span><span>N.º 021 <span className="tiny-star">✧</span></span></div>
        <div className="stage" aria-live="polite">
          {step===0 && <div className="scene entrance" key="gift"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="floating star-a">✳</span><span className="floating star-b">✧</span><span className="floating dot-a"/><button className="gift" onClick={next} aria-label="Desenvolver el regalo"><span className="bow bow-left"/><span className="bow bow-right"/><span className="gift-lid"/><span className="gift-body"/><span className="ribbon"/><span className="gift-tag">solo para<br/><b>Stacy</b><span>↗</span></span></button><span className="handnote">¡Sí, es para ti! <span>⤴</span></span></div>}
          {(step===1||step===2) && <div className="scene cake-scene entrance" key="cake"><span className="floating star-a">✳</span><span className="floating star-b">✧</span><div className="cake-art"><div className="candles">{Array.from({length:21},(_,i)=><i key={i} className={'candle '+(step===2?'out':'')} style={{'--i':i, left: (i%7)*20+Math.floor(i/7)*5, top: Math.floor(i/7)*12}}><span className="flame"/></i>)}</div><div className="cake-top"/><div className="cake-body"><div className="icing"/><span className="cake-number">21</span>{Array.from({length:9},(_,i)=><i className="sprinkle" key={i} style={{'--i':i}}/>)}</div><div className="cake-plate"/></div><span className="handnote">{step===1?'Un deseo. Y un toque.':'¡Que se cumpla!'} <span>✧</span></span></div>}
          {step===3 && <div className="card-scene entrance" key="card"><div className="birthday-card"><span className="card-kicker">30 DE OCTUBRE · TU DÍA</span><div className="card-star">✳</div><h2>¡Felices<br/><em>21, Stacy!</em></h2><p>Que esta nueva vuelta al sol venga con motivos para reír, planes que te emocionen y sorpresas de las buenas.</p><p className="card-sign">Hoy se celebra a lo grande.<br/><strong>¡Feliz cumpleaños! ✧</strong></p><span className="card-bottom">STACY BRIGITTE <span>ED. 21</span></span></div></div>}
        </div>
        <div className="panel-bottom"><div className="stage-caption"><span className="small-label">{['01 / LA SORPRESA','02 / EL DESEO','02 / EL DESEO','03 / TU NUEVO CAPÍTULO'][step]}</span><h2>{['Las cosas buenas vienen envueltas.','Pide algo bonito.','¡Bienvenidos los 21!','Este día lleva tu nombre.'][step]}</h2><p>{['Tu cumpleaños empieza con un pequeño toque.','Hay 21 velitas esperando tu deseo.','Las velitas se apagaron. Falta una cosa…','Una nueva edad. Muchísimas posibilidades.'][step]}</p></div><button className="primary" onClick={step===3?()=>{setStep(0);setBurst(0)}:next}>{['Abrir mi sorpresa','Apagar las velitas','Abrir mi tarjeta','Volver a celebrar'][step]}{step===3?<RotateCcw size={17}/>:<ArrowUpRight size={19}/>}</button></div>
      </section>
      <div className="journey" aria-label="Progreso"><span className={step===0?'active': 'done'}><b>01</b> Desenvuelve</span><i/><span className={step===1||step===2?'active':step===3?'done':''}><b>02</b> Pide un deseo</span><i/><span className={step===3?'active':''}><b>03</b> Celebra</span></div>
      <aside className="bottom-note"><span>✧</span><p>Algunas fechas merecen su propia pequeña obra de arte.</p><span>✧</span></aside>
    </main>
    <footer><span>HECHO PARA TU DÍA.</span><span>STACY / CAPÍTULO 21 <ArrowRight size={13}/></span></footer>
    {(step===2||step===3)&&<div className="confetti" key={burst} aria-hidden="true">{Array.from({length:55},(_,i)=><i key={i} style={{'--x':(i*37)%100+'vw','--delay':(i%9)*.07+'s','--rotation':i*47+'deg','--color':['#f27945','#e6bc51','#638b6a','#c49ac9','#f2aaa0'][i%5]}}/>)}</div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);


