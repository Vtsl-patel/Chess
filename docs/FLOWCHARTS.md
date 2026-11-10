# ♟️ Chess App — Complete Logic & Data Flowcharts

This document details the data structures, state lifecycles, and function algorithms powering the Chess application using **GitHub-native Mermaid diagrams**.

---

## 1. End-to-End User Interaction & Move Flow

The lifecycle of a single move from player interaction to board re-render:

```mermaid
flowchart TD
    User_Action["Player Clicks or Drags Square"] --> Handle_Click["ChessApp: handleSquareClick(pos)"]

    Handle_Click --> Check_Review{"In History Review Mode?\n(viewIndex != -1)"}
    Check_Review -- "Yes" --> Snap_Live["Snap to Live Board\ndispatch: VIEW_MOVE(-1)"]
    Check_Review -- "No" --> Check_Selection{"Square Already Selected?"}

    Check_Selection -- "No" --> Dispatch_Select["dispatch: SELECT_SQUARE(pos)"]
    Dispatch_Select --> Reducer_Select["gameReducer: SELECT_SQUARE"]
    Reducer_Select --> Is_Own_Piece{"Piece belongs to active player?"}
    Is_Own_Piece -- "Yes" --> Calc_Legal["Call getLegalMoves(board, pos, enPassantTarget)"]
    Calc_Legal --> Store_Selection["Set selectedSquare & legalMoves in GameState"]
    Is_Own_Piece -- "No" --> Clear_Selection["Clear selectedSquare & legalMoves"]

    Check_Selection -- "Yes" --> Check_Target{"Is destination in legalMoves?"}
    Check_Target -- "No" --> Check_Friendly{"Clicked another friendly piece?"}
    Check_Friendly -- "Yes" --> Calc_Legal
    Check_Friendly -- "No" --> Clear_Selection

    Check_Target -- "Yes" --> Check_Promo{"Pawn reaching 8th or 1st rank?"}
    Check_Promo -- "Yes" --> Open_Promo["Open PromotionDialog\n(Hold pendingPromotion)"]
    Open_Promo --> Player_Choice["Player picks Queen / Rook / Bishop / Knight"]
    Player_Choice --> Dispatch_Promo["dispatch: MAKE_MOVE(from, to, promotion)"]

    Check_Promo -- "No" --> Dispatch_Move["dispatch: MAKE_MOVE(from, to)"]

    Dispatch_Move --> Reducer_Move["gameReducer: MAKE_MOVE"]
    Dispatch_Promo --> Reducer_Move
    Reducer_Move --> Call_Execute["chessLogic: executeMove(...)"]
    Call_Execute --> Update_State["Update Board, Move History, Captured Pieces, Clocks"]
    Update_State --> ReRender["React Re-Renders Board, Timers, History"]
```

---

## 2. Legal Move Generation Pipeline (`getLegalMoves`)

A candidate move is only strictly legal if making it does not leave the moving player's King in check (enforces absolute pins and King escape requirements).

```mermaid
flowchart TD
    Start_Gen["getLegalMoves(board, pos, enPassantTarget)"] --> Query_Piece["getPieceAt(board, pos)"]
    Query_Piece --> Piece_Exists{"Piece Found?"}
    Piece_Exists -- "No" --> Return_Empty["Return []"]
    Piece_Exists -- "Yes" --> Gen_Pseudo["getPseudoLegalMoves(board, pos, enPassantTarget)"]

    Gen_Pseudo --> Loop_Moves["For Each Candidate Destination 'to'"]
    Loop_Moves --> Simulate["Simulate Move: applyMoveInternal(board, pos, to)"]
    Simulate --> Check_King{"isInCheck(simulatedBoard, piece.color)"}
    
    Check_King -- "True (Leaves King in Check)" --> Reject_Move["Discard Move (Illegal / Pinned)"]
    Check_King -- "False (King Safe)" --> Accept_Move["Add 'to' to legalMoves Array"]

    Reject_Move --> Check_More{"More Candidate Moves?"}
    Accept_Move --> Check_More
    Check_More -- "Yes" --> Loop_Moves
    Check_More -- "No" --> Return_Legal["Return legalMoves Array"]
```

---

## 3. Attack Detection & Check Logic (`isInCheck` & `isSquareAttacked`)

Determines whether a square (specifically the King's position) is under attack by any opposing piece:

```mermaid
flowchart TD
    Start_Check["isInCheck(board, color)"] --> Locate_King["findKing(board, color)"]
    Locate_King --> King_Found{"King Found?"}
    King_Found -- "No" --> Safe_False["Return false"]
    King_Found -- "Yes" --> Scan_Threats["isSquareAttacked(board, kingPos, opponentColor)"]

    Scan_Threats --> Pawn_Scan{"Opponent Pawn on diagonal attack square?"}
    Pawn_Scan -- "Yes" --> Check_True["Return true (In Check)"]
    Pawn_Scan -- "No" --> Knight_Scan{"Opponent Knight at any of 8 L-offsets?"}

    Knight_Scan -- "Yes" --> Check_True
    Knight_Scan -- "No" --> Orthogonal_Scan{"Opponent Rook / Queen along horizontal/vertical ray?"}

    Orthogonal_Scan -- "Yes" --> Check_True
    Orthogonal_Scan -- "No" --> Diagonal_Scan{"Opponent Bishop / Queen along diagonal ray?"}

    Diagonal_Scan -- "Yes" --> Check_True
    Diagonal_Scan -- "No" --> King_Scan{"Opponent King on adjacent square?"}

    King_Scan -- "Yes" --> Check_True
    King_Scan -- "No" --> Check_False["Return false (King Safe)"]
```

---

## 4. Atomic Move Execution (`executeMove`)

Applies moves, shifts castling rooks, removes en-passant captured pawns, generates notation, and evaluates game-over states:

```mermaid
flowchart TD
    Exec_Start["executeMove(board, from, to, turn, capturedPieces, promotion)"] --> Internal_Apply["applyMoveInternal(board, from, to, promotion)"]

    Internal_Apply --> Is_Castle{"Move is Castling?"}
    Is_Castle -- "Kingside" --> Shift_Rook_K["Move Rook from h-file to f-file"]
    Is_Castle -- "Queenside" --> Shift_Rook_Q["Move Rook from a-file to d-file"]
    Is_Castle -- "No" --> Handle_EP

    Shift_Rook_K --> Handle_EP{"Is En Passant Capture?"}
    Shift_Rook_Q --> Handle_EP

    Handle_EP -- "Yes" --> Remove_EP_Pawn["Remove passed pawn at (from.rank, to.file)"]
    Handle_EP -- "No" --> Check_Double_Push{"Did pawn move 2 squares forward?"}
    Remove_EP_Pawn --> Check_Double_Push

    Check_Double_Push -- "Yes" --> Set_EP_Target["Set newEnPassantTarget to skipped square"]
    Check_Double_Push -- "No" --> Clear_EP_Target["Set newEnPassantTarget = null"]

    Set_EP_Target --> Generate_Notation["generateSAN(...)"]
    Clear_EP_Target --> Generate_Notation

    Generate_Notation --> Status_Evaluation{"Evaluate Opponent State"}
    Status_Evaluation --> Eval_Checkmate{"isCheckmate(newBoard, opponent)?"}
    Eval_Checkmate -- "Yes" --> End_Mate["status = 'checkmate'\nwinner = turn"]

    Eval_Checkmate -- "No" --> Eval_Stalemate{"isStalemate(newBoard, opponent)?"}
    Eval_Stalemate -- "Yes" --> End_Stalemate["status = 'stalemate'\nwinner = 'draw'"]

    Eval_Stalemate -- "No" --> Eval_Insuff{"isInsufficientMaterial(newBoard)?"}
    Eval_Insuff -- "Yes" --> End_Insuff["status = 'draw-insufficient'\nwinner = 'draw'"]

    Eval_Insuff -- "No" --> Eval_Check{"isInCheck(newBoard, opponent)?"}
    Eval_Check -- "Yes" --> Status_Check["status = 'check'\nwinner = null"]
    Eval_Check -- "No" --> Status_Play["status = 'playing'\nwinner = null"]

    End_Mate --> Return_Result["Return { newBoard, newTurn, move, capturedPieces, status, winner }"]
    End_Stalemate --> Return_Result
    End_Insuff --> Return_Result
    Status_Check --> Return_Result
    Status_Play --> Return_Result
```

---

## 5. Algebraic Notation Generation (`generateSAN`)

Generates Standard Algebraic Notation according to FIDE standards:

```mermaid
flowchart TD
    SAN_Start["generateSAN(...)"] --> Castle_SAN{"Is Castle?"}
    Castle_SAN -- "Kingside" --> SAN_OO["Return 'O-O'"]
    Castle_SAN -- "Queenside" --> SAN_OOO["Return 'O-O-O'"]

    Castle_SAN -- "No" --> Piece_Type{"piece.type == 'pawn'?"}
    Piece_Type -- "Yes" --> Pawn_Capture{"Captured piece or En Passant?"}
    Pawn_Capture -- "Yes" --> SAN_Pawn_Cap["san = from.file + 'x' + to.file + to.rank"]
    Pawn_Capture -- "No" --> SAN_Pawn_Push["san = to.file + to.rank"]

    SAN_Pawn_Cap --> Add_Promotion{"Promotion Piece Defined?"}
    SAN_Pawn_Push --> Add_Promotion
    Add_Promotion -- "Yes" --> Append_Promo["san += '=' + promo.toUpperCase()"]
    Add_Promotion -- "No" --> Check_Mate_Suffix

    Piece_Type -- "No" --> Piece_Letter["san = piece.letter ('N', 'B', 'R', 'Q', 'K')"]
    Piece_Letter --> Check_Ambiguity{"Another same piece can legally move to 'to'?"}
    Check_Ambiguity -- "Yes (Different Files)" --> Disambig_File["san += from.file"]
    Check_Ambiguity -- "Yes (Same File, Different Ranks)" --> Disambig_Rank["san += from.rank"]
    Check_Ambiguity -- "Yes (Same File & Rank)" --> Disambig_Both["san += from.file + from.rank"]
    Check_Ambiguity -- "No" --> Check_Capture

    Disambig_File --> Check_Capture{"Captured Piece?"}
    Disambig_Rank --> Check_Capture
    Disambig_Both --> Check_Capture

    Check_Capture -- "Yes" --> Append_Capture["san += 'x' + to.file + to.rank"]
    Check_Capture -- "No" --> Append_Target["san += to.file + to.rank"]

    Append_Capture --> Check_Mate_Suffix{"Opponent In Check or Checkmate?"}
    Append_Target --> Check_Mate_Suffix
    Append_Promo --> Check_Mate_Suffix

    Check_Mate_Suffix -- "Checkmate" --> Suffix_Mate["san += '#'"]
    Check_Mate_Suffix -- "Check" --> Suffix_Check["san += '+'"]
    Check_Mate_Suffix -- "Neither" --> Return_SAN["Return san string"]

    Suffix_Mate --> Return_SAN
    Suffix_Check --> Return_SAN
```

---

## 6. Reducer State Machine Lifecycle (`gameReducer`)

```mermaid
flowchart TD
    Action["Action Dispatched to gameReducer"] --> Switch_Action{"action.type"}

    Switch_Action -- "SELECT_SQUARE" --> Handle_Select["Select square if friendly piece;\ndeselect if re-clicked;\nexecute move if legal destination clicked"]
    Switch_Action -- "CLEAR_SELECTION" --> Handle_Clear["selectedSquare = null, legalMoves = []"]
    Switch_Action -- "MAKE_MOVE" --> Handle_Move["executeMove() -> updates board, turn, history, clocks;\nresets viewIndex to -1 (live)"]
    Switch_Action -- "UNDO_MOVE" --> Handle_Undo["Pops moveHistory;\nrestores previous board state, captured pieces & clocks"]
    Switch_Action -- "VIEW_MOVE" --> Handle_View["Sets viewIndex to past move index for replay without modifying live board"]
    Switch_Action -- "TICK_TIMER" --> Handle_Timer["Decrements active player's clock;\ntriggers status = 'timeout' if time <= 0"]
    Switch_Action -- "SET_TIME_CONTROL" --> Handle_TC["Updates preset: 10m, 5m, 3m, 1m, null (untimed)"]
    Switch_Action -- "FLIP_BOARD" --> Handle_Flip["Toggles isFlipped boolean (180° rotation)"]
    Switch_Action -- "RESET_GAME" --> Handle_Reset["Resets board & clocks to initialGameState"]
```

