import { useState, useRef, useEffect } from "react";
import { FaMapMarkedAlt, FaRoute, FaPlay, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { GiPathDistance } from "react-icons/gi";
import { MdLocationOn } from "react-icons/md";

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
  };

  const dessinerGrapheAnime = (chemin, distances) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rayon = 180;
    const centreX = canvas.width / 2;
    const centreY = canvas.height / 2;

    const positions = villes.map((_, i) => {
      const angle = (2 * Math.PI / 6) * i;
      return {
        x: centreX + rayon * Math.cos(angle),
        y: centreY + rayon * Math.sin(angle)
      };
    });

    villes.forEach((ville, i) => {
      const pos = positions[i];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();

      // Dessin de l'icône
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(ville, pos.x - 5, pos.y + 5);
    });

    let i = 0;
    function animerLigne() {
      if (i >= chemin.length - 1) return;

      const a = positions[chemin[i]];
      const b = positions[chemin[i + 1]];
      const distance = distances[chemin[i]][chemin[i + 1]];

      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;

      ctx.fillStyle = "#fff";
      ctx.fillRect(midX - 15, midY - 12, 30, 24);

      ctx.fillStyle = "red";
      ctx.font = "bold 14px Arial";
      ctx.fillText(distance, midX - 5, midY + 5);

      i++;
      setTimeout(() => requestAnimationFrame(animerLigne), 700);
    }

    animerLigne();
  };

  useEffect(() => {
    if (step === 3 && cheminFinal.length > 0) {
      const parsed = distances.map((row) =>
        row.map((val) => (val === "" ? Infinity : parseInt(val)))
      );
      dessinerGrapheAnime(cheminFinal, parsed);
    }
  }, [step]);

  const handleNext = () => {
    if (step === 1 && !tableauRempli()) {
      alert("Veuillez remplir toutes les distances.");
      return;
    }
    if (step === 2) {
      trouverCheminOptimal();
    }
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial", padding: 20 }}>
      <h1><FaMapMarkedAlt /> Voyageur de Commerce</h1>

      {step === 1 && (
        <>
          <h2><GiPathDistance /> Saisie des distances</h2>
          <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
            <thead>
              <tr>
                <th></th>
                {villes.map((v, i) => <th key={i}>{v}</th>)}
              </tr>
            </thead>
            <tbody>
              {villes.map((ligne, i) => (
                <tr key={i}>
                  <th>{ligne}</th>
                  {villes.map((_, j) => (
                    <td key={j} style={{ border: "1px solid #000", padding: "5px" }}>
                      {i === j ? (
                        <input type="number" value="0" disabled style={{ width: "40px", backgroundColor: "#eee" }} />
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={distances[i][j]}
                          onChange={e => handleChange(i, j, e.target.value)}
                          style={{ width: "40px", backgroundColor: "#f9f9f9" }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {step === 2 && (
        <>
          <h2><FaRoute /> Calcul du chemin optimal...</h2>
          <p>Recherche du chemin minimal parmi toutes les permutations possibles...</p>
        </>
      )}

      {step === 3 && (
        <>
          <h2><FaPlay /> Résultat</h2>
          <h3>{resultat}</h3>
          <canvas ref={canvasRef} width="500" height="500" style={{ border: "1px solid #ccc", marginTop: 20 }} />
        </>
      )}

      <div style={{ marginTop: 30 }}>
        {step > 1 && (
          <button onClick={handlePrev} style={{ padding: "10px 20px", marginRight: 20, fontSize: "16px" }}>
            ← Précédent
          </button>
        )}
        {step < 3 && (
          <button onClick={handleNext} style={{ padding: "10px 20px", fontSize: "16px" }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
