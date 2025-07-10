import { useState, useRef, useEffect } from "react";
import { FaMapMarkedAlt, FaRoute, FaPlay } from "react-icons/fa";
import { GiPathDistance } from "react-icons/gi";

const villes = ["A", "B", "C", "D", "E", "F"];

function App() {
  const [step, setStep] = useState(1);
  const [distances, setDistances] = useState(() =>
    Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? 0 : ""))
    )
  );
  const [resultat, setResultat] = useState("");
  const [cheminFinal, setCheminFinal] = useState([]);
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef();

  const handleChange = (i, j, value) => {
    setDistances((prev) => {
      const newDistances = prev.map((row) => [...row]);
      newDistances[i][j] = value === "" ? "" : Math.max(0, parseInt(value));
      return newDistances;
    });
  };

  const tableauRempli = () => {
    return distances.every((row, i) =>
      row.every((val, j) => (i === j ? true : val !== ""))
    );
  };

  const permute = (arr) => {
    const results = [arr.slice()];
    const c = Array(arr.length).fill(0);
    let i = 1;
    while (i < arr.length) {
      if (c[i] < i) {
        const k = i % 2 && c[i];
        [arr[i], arr[k]] = [arr[k], arr[i]];
        ++c[i];
        i = 1;
        results.push(arr.slice());
      } else {
        c[i] = 0;
        ++i;
      }
    }
    return results;
  };

  const trouverCheminOptimal = () => {
    setTimeout(() => {
      const parsed = distances.map((row) =>
        row.map((val) => (val === "" ? Infinity : parseInt(val)))
      );
      const permutations = permute([1, 2, 3, 4, 5]);
      let meilleurCout = Infinity;
      let meilleurChemin = [];

      for (let perm of permutations) {
        const chemin = [0, ...perm, 0];
        let cout = 0;
        for (let i = 0; i < chemin.length - 1; i++) {
          const d = parsed[chemin[i]][chemin[i + 1]];
          if (d === Infinity) {
            cout = Infinity;
            break;
          }
          cout += d;
        }
        if (cout < meilleurCout) {
          meilleurCout = cout;
          meilleurChemin = chemin;
        }
      }

      setCheminFinal(meilleurChemin);
      setResultat(
        `Chemin optimal : ${meilleurChemin.map((i) => villes[i]).join(" → ")} (Coût : ${meilleurCout})`
      );
      setStep(3);
    }, 1200);
  };

  const dessinerGrapheAnime = (chemin, distances, hover) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rayon = Math.min(canvas.width, canvas.height) / 2 - 60;
    const centreX = canvas.width / 2;
    const centreY = canvas.height / 2;

    const positions = villes.map((_, i) => {
      const angle = (2 * Math.PI / villes.length) * i - Math.PI / 2;
      return {
        x: centreX + rayon * Math.cos(angle),
        y: centreY + rayon * Math.sin(angle)
      };
    });

    // Fonction pour dessiner le fond (arêtes et noeuds)
    function dessinerFond() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Arêtes normales
      for (let i = 0; i < villes.length; i++) {
        for (let j = i + 1; j < villes.length; j++) {
          if (distances[i][j] !== "" && distances[i][j] !== Infinity) {
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();
          }
        }
      }
      // Noeuds
      villes.forEach((ville, i) => {
        const pos = positions[i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, 2 * Math.PI);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#0ea5e9";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ville, pos.x, pos.y);
      });
    }

    // Animation infinie du chemin optimal
    let i = 0;
    let lastTimestamp = 0;
    let animating = true;

    function animerLigne(timestamp) {
      if (!animating || !hover()) return;
      if (!lastTimestamp) lastTimestamp = timestamp;
      const progress = timestamp - lastTimestamp;

      // On dessine le fond à chaque frame pour effacer les arcs jaunes précédents
      dessinerFond();

      // On dessine les arcs jaunes jusqu'à l'étape i
      for (let k = 0; k < i && k < chemin.length - 1; k++) {
        const a = positions[chemin[k]];
        const b = positions[chemin[k + 1]];
        const distance = distances[chemin[k]][chemin[k + 1]];

        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Affichage du coût sur l'arête
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(-15, -12, 30, 24);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(distance, 0, 0);
        ctx.restore();
      }

      // Animation : on avance d'un arc toutes les 400ms
      if (progress > 400) {
        i++;
        lastTimestamp = timestamp;
      }

      if (i <= chemin.length - 1) {
        requestAnimationFrame(animerLigne);
      } else {
        // Pause puis recommence
        setTimeout(() => {
          i = 0;
          lastTimestamp = 0;
          if (hover()) requestAnimationFrame(animerLigne);
        }, 800);
      }
    }

    if (hover()) requestAnimationFrame(animerLigne);

    // Nettoyage si le composant est démonté ou si on relance l'animation
    return () => { animating = false; };
  };

  useEffect(() => {
    if (step === 3 && cheminFinal.length > 0 && isHovered) {
      // Nettoyage de l'animation précédente si besoin
      let cleanup;
      cleanup = dessinerGrapheAnime(
        cheminFinal,
        distances.map((row) => row.map((val) => (val === "" ? Infinity : parseInt(val)))),
        () => isHovered
      );
      return cleanup;
    } else if (step === 3 && cheminFinal.length > 0 && !isHovered) {
      // Affiche le graphe statique sans animation
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rayon = Math.min(canvas.width, canvas.height) / 2 - 60;
      const centreX = canvas.width / 2;
      const centreY = canvas.height / 2;
      const positions = villes.map((_, i) => {
        const angle = (2 * Math.PI / villes.length) * i - Math.PI / 2;
        return {
          x: centreX + rayon * Math.cos(angle),
          y: centreY + rayon * Math.sin(angle)
        };
      });
      // ...dessiner le fond...
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < villes.length; i++) {
        for (let j = i + 1; j < villes.length; j++) {
          if (distances[i][j] !== "" && distances[i][j] !== Infinity) {
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();
          }
        }
      }
      villes.forEach((ville, i) => {
        const pos = positions[i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, 2 * Math.PI);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#0ea5e9";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ville, pos.x, pos.y);
      });
      // Chemin optimal en jaune (statique)
      for (let k = 0; k < cheminFinal.length - 1; k++) {
        const a = positions[cheminFinal[k]];
        const b = positions[cheminFinal[k + 1]];
        const distance = distances[cheminFinal[k]][cheminFinal[k + 1]];
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(-15, -12, 30, 24);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(distance, 0, 0);
        ctx.restore();
      }
    }
  }, [step, cheminFinal, distances, isHovered]);

  const handleNext = () => {
    setError("");
    if (step === 1 && !tableauRempli()) {
      setError("Veuillez remplir toutes les distances.");
      return;
    }
    if (step === 1) {
      setStep(2);
      setTimeout(trouverCheminOptimal, 800);
    }
  };

  const handlePrev = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        padding: 10,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        minHeight: "100vh",
        minWidth: "100vw",
        boxSizing: "border-box",
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <h1
        style={{
          color: "#38bdf8",
          marginBottom: 10,
          fontSize: "2.2rem",
          letterSpacing: 1,
          textShadow: "0 2px 8px #0ea5e9",
        }}
      >
        <FaMapMarkedAlt /> Voyageur de Commerce
      </h1>

      {step === 1 && (
        <>
          <h2 style={{ color: "#60a5fa", fontSize: "1.3rem" }}>
            <GiPathDistance /> Saisie des distances
          </h2>
          <div style={{ overflowX: "auto", margin: "0 auto", maxWidth: 600 }}>
            <table
              style={{
                borderCollapse: "collapse",
                margin: "0 auto",
                background: "#1e293b",
                borderRadius: 12,
                boxShadow: "0 2px 12px #0ea5e9",
                width: "100%",
                minWidth: 400,
              }}
            >
              <thead>
                <tr>
                  <th></th>
                  {villes.map((v, i) => (
                    <th key={i} style={{ color: "#38bdf8" }}>
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {villes.map((ligne, i) => (
                  <tr key={i}>
                    <th style={{ color: "#38bdf8" }}>{ligne}</th>
                    {villes.map((_, j) => (
                      <td
                        key={j}
                        style={{
                          border: "1px solid #334155",
                          padding: "5px",
                          background: i === j ? "#334155" : "#0f172a",
                        }}
                      >
                        {i === j ? (
                          <input
                            type="number"
                            value="0"
                            disabled
                            style={{
                              width: "40px",
                              backgroundColor: "#334155",
                              border: "none",
                              color: "#64748b",
                            }}
                          />
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={distances[i][j]}
                            onChange={(e) =>
                              handleChange(i, j, e.target.value)
                            }
                            style={{
                              width: "40px",
                              backgroundColor: "#1e293b",
                              border: "1px solid #38bdf8",
                              borderRadius: 5,
                              textAlign: "center",
                              color: "#f1f5f9",
                            }}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && (
            <div
              style={{
                color: "#f87171",
                marginTop: 15,
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {error}
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <div style={{ margin: "60px 0" }}>
          <div
            className="loader"
            style={{
              border: "6px solid #334155",
              borderTop: "6px solid #38bdf8",
              borderRadius: "50%",
              width: 50,
              height: 50,
              animation: "spin 1s linear infinite",
              margin: "auto",
            }}
          />
          <style>
            {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
          </style>
          <h2 style={{ color: "#38bdf8", marginTop: 30, fontSize: "1.2rem" }}>
            <FaRoute /> Calcul du chemin optimal...
          </h2>
          <p style={{ color: "#38bdf8" }}>
            Recherche du chemin minimal parmi toutes les permutations possibles...
          </p>
        </div>
      )}

      {step === 3 && (
        <>
          <h2 style={{ color: "#facc15", fontSize: "1.3rem", textShadow: "0 2px 8px #0ea5e9" }}>
            <FaPlay /> Résultat
          </h2>
          <h3 style={{ color: "#facc15", fontSize: "1.1rem" }}>{resultat}</h3>
          <ul
            style={{
              display: "inline-block",
              textAlign: "left",
              margin: "10px auto 20px",
              padding: 0,
              fontSize: "1.1rem",
            }}
          >
            {cheminFinal.map((i, idx) => (
              <li
                key={idx}
                style={{
                  listStyle: "none",
                  color: "#38bdf8",
                  fontWeight: "bold",
                  display: "inline",
                }}
              >
                {villes[i]}
                {idx < cheminFinal.length - 1 && (
                  <span style={{ color: "#64748b" }}> → </span>
                )}
              </li>
            ))}
          </ul>
          <div style={{ overflowX: "auto", margin: "0 auto", maxWidth: 520, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 500, minWidth: 320 }}>
              <canvas
                ref={canvasRef}
                width="500"
                height="500"
                style={{
                  border: "2px solid #38bdf8",
                  marginTop: 20,
                  borderRadius: 16,
                  background: "#0f172a",
                  boxShadow: "0 2px 12px #0ea5e9",
                  width: "100%",
                  maxWidth: 500,
                  height: "auto",
                  display: "block",
                  cursor: "pointer"
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                title="Survolez pour voir l'animation du chemin optimal"
              />
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 30 }}>
        {step > 1 && (
          <button
            onClick={handlePrev}
            style={{
              padding: "10px 24px",
              marginRight: 20,
              fontSize: "16px",
              background: "#1e293b",
              color: "#38bdf8",
              border: "2px solid #38bdf8",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 1px 4px #0ea5e9",
              marginBottom: 10,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            ← Précédent
          </button>
        )}
        {step === 1 && (
          <button
            onClick={handleNext}
            style={{
              padding: "10px 24px",
              fontSize: "16px",
              background: "#38bdf8",
              color: "#0f172a",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 1px 4px #0ea5e9",
              marginBottom: 10,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}

// Plein écran : styles globaux pour html et body
const style = document.createElement('style');
style.innerHTML = `
  html, body {
    height: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    width: 100vw;
    box-sizing: border-box;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  #root {
    width: 100vw;
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);

export default App;