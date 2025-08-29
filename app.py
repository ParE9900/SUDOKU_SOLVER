from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

class SudokuSolver:
    def __init__(self, board):
        self.board = board
        self.rows = [set() for _ in range(9)]
        self.cols = [set() for _ in range(9)]
        self.boxes = [set() for _ in range(9)]
        self.is_initially_valid = self._initialize_and_validate()

    def _get_box_index(self, r, c):
        return (r // 3) * 3 + (c // 3)

    def _initialize_and_validate(self):
        for r in range(9):
            for c in range(9):
                num = self.board[r][c]
                if num != 0:
                    box_idx = self._get_box_index(r, c)
                    if num in self.rows[r] or num in self.cols[c] or num in self.boxes[box_idx]:
                        return False 
                    self.rows[r].add(num)
                    self.cols[c].add(num)
                    self.boxes[box_idx].add(num)
        return True

    def _is_valid_placement(self, num, r, c):
        box_idx = self._get_box_index(r, c)
        return num not in self.rows[r] and num not in self.cols[c] and num not in self.boxes[box_idx]

    def _place_number(self, num, r, c):
        box_idx = self._get_box_index(r, c)
        self.board[r][c] = num
        self.rows[r].add(num)
        self.cols[c].add(num)
        self.boxes[box_idx].add(num)

    def _remove_number(self, num, r, c):
        box_idx = self._get_box_index(r, c)
        self.board[r][c] = 0
        self.rows[r].remove(num)
        self.cols[c].remove(num)
        self.boxes[box_idx].remove(num)

    def _find_best_empty_cell(self):
        best_cell = None
        min_options = 10
        for r in range(9):
            for c in range(9):
                if self.board[r][c] == 0:
                    num_options = 0
                    possible_options = []
                    for num in range(1, 10):
                        if self._is_valid_placement(num, r, c):
                            num_options += 1
                            possible_options.append(num)
                    
                    if num_options < min_options:
                        min_options = num_options
                        best_cell = ((r, c), possible_options)
                        if min_options <= 1:
                            return best_cell
        return best_cell

    def _solve_recursive(self):
        find_result = self._find_best_empty_cell()
        if not find_result:
            return True
        
        (r, c), possible_options = find_result
        if not possible_options:
            return False

        for num in possible_options:
            self._place_number(num, r, c)
            if self._solve_recursive():
                return True
            self._remove_number(num, r, c)
        
        return False

    def solve(self):
        if not self.is_initially_valid:
            return False
        return self._solve_recursive()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve_route():
    try:
        data = request.get_json()
        board_str = data['board']
        
        # Convert the board to integers (empty strings become 0)
        board_int = [[0]*9 for _ in range(9)]
        for i in range(9):
            for j in range(9):
                try:
                    board_int[i][j] = int(board_str[i][j]) if board_str[i][j] else 0
                except (ValueError, TypeError):
                    return jsonify({
                        'status': 'error',
                        'message': f'Invalid value at row {i+1}, column {j+1}: {board_str[i][j]}'
                    })
            
        solver = SudokuSolver(board_int)
        solved = solver.solve()
        
        if solved:
            # Convert solution back to strings
            solution_board = [[str(num) for num in row] for row in solver.board]
            return jsonify({'status': 'success', 'solution': solution_board})
        else:
            return jsonify({
                'status': 'error',
                'message': 'No solution found. The puzzle may be invalid or unsolvable.'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        })

if __name__ == '__main__':
    app.run(debug=True)