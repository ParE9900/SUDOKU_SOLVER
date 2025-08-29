document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const grid = document.getElementById("sudoku-grid");
  const solveBtn = document.getElementById("solve-btn");
  const clearBtn = document.getElementById("clear-btn");
  const animationToggle = document.getElementById("animation-toggle");
  const speedSlider = document.getElementById("speed-slider");
  const statusIndicator = document.getElementById("status-indicator");

  // Game State
  let solving = false;
  let originalBoard = Array(9)
    .fill()
    .map(() => Array(9).fill(""));

  // Initialize grid
  function createGrid() {
    for (let i = 0; i < 9; i++) {
      const row = document.createElement("tr");
      for (let j = 0; j < 9; j++) {
        const cell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.dataset.row = i;
        input.dataset.col = j;

        input.addEventListener("input", (e) => {
          const value = e.target.value;
          if (value && !/^[1-9]$/.test(value)) {
            e.target.value = "";
          }
        });

        cell.appendChild(input);
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
  }

  // Get current board state
  function getBoardState() {
    const board = Array(9)
      .fill()
      .map(() => Array(9).fill(""));
    const inputs = document.querySelectorAll("#sudoku-grid input");

    inputs.forEach((input) => {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      board[row][col] = input.value;
    });

    return board;
  }

  // Update board display
  function setBoardState(board, markOriginals = false) {
    const inputs = document.querySelectorAll("#sudoku-grid input");

    inputs.forEach((input) => {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      input.value = board[row][col] || "";
      input.classList.remove("original-cell", "solved-cell");

      if (
        markOriginals &&
        board[row][col] &&
        originalBoard[row][col] === board[row][col]
      ) {
        input.classList.add("original-cell");
      } else if (board[row][col]) {
        input.classList.add("solved-cell");
      }
    });
  }

  // Disable/enable grid inputs
  function disableGridInputs(disabled) {
    const inputs = document.querySelectorAll("#sudoku-grid input");
    inputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  // Solve the puzzle
  async function solveSudoku() {
    if (solving) return;

    solving = true;
    solveBtn.disabled = true;
    solveBtn.classList.remove("pulse");
    statusIndicator.style.display = "block";
    disableGridInputs(true);

    const board = getBoardState();
    originalBoard = board.map((row) => [...row]);

    try {
      const response = await fetch("/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board }),
      });

      const result = await response.json();

      if (result.status === "success") {
        const solution = result.solution;

        if (animationToggle.checked) {
          await animateSolution(solution);
        } else {
          setBoardState(solution, true);
        }
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while solving the puzzle.");
    } finally {
      solving = false;
      solveBtn.disabled = false;
      solveBtn.classList.add("pulse");
      statusIndicator.style.display = "none";
      disableGridInputs(false);
    }
  }

  // Animate the solution
  async function animateSolution(solution) {
    const inputs = document.querySelectorAll("#sudoku-grid input");
    const emptyCells = [];

    inputs.forEach((input) => {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      if (!input.value) {
        emptyCells.push({ input, row, col });
      }
    });

    const delay = 400 - speedSlider.value * 19;

    for (const cell of emptyCells) {
      const { input, row, col } = cell;
      input.classList.add("highlight");
      await new Promise((resolve) => setTimeout(resolve, delay));
      input.value = solution[row][col];
      input.classList.remove("highlight");
      input.classList.add("solved-cell");
    }
  }

  // Clear the board
  function clearBoard() {
    if (solving) return;

    const inputs = document.querySelectorAll("#sudoku-grid input");
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("original-cell", "solved-cell", "highlight");
      input.disabled = false;
    });

    solveBtn.disabled = false;
    solveBtn.classList.add("pulse");
    originalBoard = Array(9)
      .fill()
      .map(() => Array(9).fill(""));
  }

  // Pre-fill a sample puzzle
  function prefillSample() {
    const samplePuzzle = [
      ["5", "3", "", "", "7", "", "", "", ""],
      ["6", "", "", "1", "9", "5", "", "", ""],
      ["", "9", "8", "", "", "", "", "6", ""],
      ["8", "", "", "", "6", "", "", "", "3"],
      ["4", "", "", "8", "", "3", "", "", "1"],
      ["7", "", "", "", "2", "", "", "", "6"],
      ["", "6", "", "", "", "", "2", "8", ""],
      ["", "", "", "4", "1", "9", "", "", "5"],
      ["", "", "", "", "8", "", "", "7", "9"],
    ];

    setBoardState(samplePuzzle);
  }

  // Initialize the app
  createGrid();
  prefillSample();

  // Event listeners
  solveBtn.addEventListener("click", solveSudoku);
  clearBtn.addEventListener("click", clearBoard);
});
