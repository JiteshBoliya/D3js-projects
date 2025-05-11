const row = ['8', '7', '6', '5', '4', '3', '2', '1'];
const column = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const chessmoves = {
    "KING": {
        x: [1, 1, -1, -1, 1, -1, 0, 0],
        y: [1, -1, 1, -1, 0, 0, 1, -1]
    },
    "KNIGHT": {
        x: [2, 2, -2, -2, -1, -1, 1, 1],
        y: [-1, 1, 1, -1, 2, -2, 2, -2]
    },
    "ROOK": {
        x: [-1, 1, 0, 0],
        y: [0, 0, 1, -1]
    },
    "BISHOP": {
        x: [-1, 1, -1, 1],
        y: [-1, 1, 1, -1]
    },
    "QUEEN": {
        x: [-1, 1, -1, 1, -1, 1, 0, 0],
        y: [-1, 1, 1, -1, 0, 0, 1, -1]
    }
};

const castlingPositions = {
    "WHITE": {
        "KINGSIDE": ['f1', 'g1'],
        "QUEENSIDE": ['b1', 'c1', 'd1']
    },
    "BLACK": {
        "KINGSIDE": ['f8', 'g8'],
        "QUEENSIDE": ['b8', 'c8', 'd8']
    }
}

const promotionOptions = ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT'];

const colorScheme = [
    ["#706677", "#ccb7ae", "#191d32"], // 0
    ["#70a2a3", "#b1e4b9", "#445235"], // 1
    ["#b88b4a", "#e3c16f", "#874f28"], // 2
    ["#808080", "#ffffff", "#000000"]  // 3
];
const colorSchemes = [
    { title: "ChessBoardColor 1", value: 0 },
    { title: "ChessBoardColor 2", value: 1 },
    { title: "ChessBoardColor 3", value: 2 },
    { title: "ChessBoardColor 4", value: 3 }];

const piecesSchema = [
    // { title: "ChessPieceStyle 1", value: "chess1" },
    { title: "ChessPieceStyle 1", value: "chess2" },
    { title: "ChessPieceStyle 2", value: "chess3" },
    // { title: "ChessPieceStyle 4", value: "chess4" }
]

const notationKeys = d3.scaleOrdinal()
    .domain(['KING', 'QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'PAWN', 'Capture', 'Promotion', 'Check', 'Checkmate', 'Move', 'KingSideCastling', 'QueenSideCastling'])
    .range(['K', 'Q', 'R', 'B', 'N', '', 'x', '=', '+', '#', '', 'O-O', 'O-O-O']);

const whitePieces = [
    "WHITE_ROOK",
    "WHITE_KNIGHT",
    "WHITE_BISHOP",
    "WHITE_QUEEN",
    "WHITE_KING",
    "WHITE_POWN"
];

const blackPieces = [
    "BLACK_ROOK",
    "BLACK_KNIGHT",
    "BLACK_BISHOP",
    "BLACK_QUEEN",
    "BLACK_KING",
    "BLACK_POWN"
];

const margin = 10;
const arraySize = 8;
const squareSize = 100;
const pieceSize = 70;
const boardSize = (row.length || column.length) * squareSize;
const size = boardSize + margin + 100;
const selectionColorForBlack = "#d1d17e";
const selectionColorForWhite = "#d1d17e"; //#b47979
const api = './data/initialPosiition.json';

const notationWhite = d3.select("#notationWhite");
const notationBlack = d3.select("#notationBlack");

const captureWhite = d3.select("#captureWhite");
const captureBlack = d3.select("#captureBlack");
const chessMessage = d3.select("#message");

const modal = document.getElementById("myModal");
const modelButtonContainer = document.getElementById("modelButtonContainer");
const footerButtonContainer = document.getElementById("buttonContainer");
const modelTitle = document.getElementById("modelTitle");
const chessboard = document.getElementById("chessboard");

let selectedPieces = null;
let kingAttackBy = null;
let kingOnAttack = null;
let pawnPromotion = null;
let suggestedPath = [];
let suggestedCapture = [];
let suggestedCastle = [];
let notationListWhite = [];
let notationListBlack = [];
let capturedListWhite = [];
let capturedListBlack = [];
let selectedColors = 0;
let selectedChessPieces = 'chess2';
let turn = 'WHITE';
let notationText = '';

const notation = {
    pieceType: '',
    moveType: '', //move or capture
    place: '',
    promotion: '',
    check: '',
    checkmate: ''
}

const turnLable = d3
    .select("#turn")
    .append("text")
    .text(`${turn}'s turn`)
    .attr("class", turn);

const svg = d3
    .select("#chessboard")
    .attr("width", chessboard.clientWidth)
    .attr("height", chessboard.clientHeight)
    .attr("viewBox", [-50, -50, size, size]);
// .style("background-color", colorScheme[selectedColors][2])
// .style("color", "white")
// .style("border-radius", "50px")


//Append a defs (for definition) element to your SVG
const defs = svg.append("defs");

//Append a radialGradient element to the defs and give it a unique id
const radialGradient = defs.append("radialGradient")
    .attr("id", "radial-gradient")
    .attr("cx", "50%")    //The x-center of the gradient
    .attr("cy", "50%")    //The y-center of the gradient
    .attr("r", "50%");   //The radius of the gradient

//Add colors to make the gradient appear like a Sun
radialGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#FFF76B");
radialGradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "#FFF845");
radialGradient.append("stop")
    .attr("offset", "90%")
    .attr("stop-color", "#FFDA4E");
radialGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "White");

loadChess();
function loadChess() {
    d3.json(api).then((positionData) => {
        // Modified data
        positionData = positionData.map((p, i) => {
            p.row = p.place.slice(0, 1);
            p.column = p.place.slice(1);
            p.type = p.piece.slice(0, 5);
            p.image = `./images/${selectedChessPieces}/${p.piece}.png`;
            p.id = `c${i}`;
            p.isFirst = true;
            return p;
        });
        // const drag = d3.drag()
        //     .on('start', dragStart)
        //     .on('drag', handleDrag)
        //     .on('end', dragged);

        const x = d3.scaleBand()
            .domain(column)
            .range([0, boardSize + margin]);

        const y = d3.scaleBand()
            .domain(row)
            .range([0, boardSize + margin]);

        svg.append("g")
            .attr("transform", `translate(0,${boardSize + margin})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisTop(x));

        svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisLeft(y));

        svg.append("g")
            .attr("transform", `translate(${boardSize + margin},0)`)
            .call(d3.axisRight(y));

        d3.selectAll(".domain").style("stroke", "none");
        d3.selectAll(".tick").attr("class", "ticks");

        const g = svg
            .append("g")
            .attr("id", "chessBoard");

        const chessBlocks = g
            .append("g")
            .attr("id", "chessBlocks");

        const chessPieces = g
            .append("g")
            .attr("id", "images")
            .selectAll("image");

        loadChessBoard();
        loadChessPieces();
        loadChessNotationView();
        chessBoradSelection(colorSchemes);
        chessPiecesSelection(piecesSchema);
        highlightTurn("WHITE");

        // ======= Load ========
        function loadChessBoard() {
            chessBlocks
                .selectAll("rect")
                .remove();

            // Create chess boxes
            for (let i = 0; i < row.length; i++) {
                for (let j = 0; j < column.length; j++) {
                    chessBlocks
                        .append("rect")
                        .attr("x", (j * squareSize) + margin / 2)
                        .attr("y", (i * squareSize) + margin / 2)
                        .attr("width", squareSize - 1)
                        .attr("height", squareSize - 1)
                        .attr("id", `r${row[i]}${column[j]}`)
                        // .attr("class", "chessRects")
                        .style("fill", (i + j) % 2 === 0 ? colorScheme[selectedColors][1] : colorScheme[selectedColors][0])
                        .on("click", chessBoxClick);
                }
            };
            // svg.style("background-color", colorScheme[selectedColors][2])
        }

        function loadChessPieces() {
            d3.selectAll("image").remove();
            chessPieces
                .data(positionData)
                .enter()
                .append("image")
                .attr("xlink:href", (d) => d.image)
                .attr("alt", (d) => d.id)
                .attr("x", (d) => (d.column.charCodeAt(0) - 97) * 100 + (squareSize / 5))
                .attr("y", (d) => (8 - parseInt(d.row)) * 100 + (squareSize / 5))
                .attr("width", pieceSize)
                .attr("height", pieceSize)
                .attr("id", (d) => d.id)
                .attr("class", "chessPieces")
                .on("click", chessPieceClick)
            // .call(drag);
        }

        function loadChessCaptureView() {
            d3.selectAll("#capturedBlackImage").remove();
            d3.selectAll("#capturedWhiteImage").remove();

            captureBlack
                .selectAll("image")
                .data(capturedListBlack)
                .enter()
                .append("img")
                .attr("id", "capturedBlackImage")
                .attr("src", (d) => d.image)
                .attr("height", 70);

            captureWhite
                .selectAll("image")
                .data(capturedListWhite)
                .enter()
                .append("img")
                .attr("id", "capturedWhiteImage")
                .attr("src", (d) => d.image)
                .attr("height", 70);
        }

        function loadChessNotationView() {
            // Currently this code is demo perpose only (implemanted this functionality soon)
            notationWhite.selectAll("div").remove();
            notationBlack.selectAll("div").remove();

            notationListBlack.forEach((nb) => {
                notationBlack
                    .append("div")
                    .attr("class", "notaionRow")
                    .append("text")
                    .text(nb);
            });
            notationListWhite.forEach((nw) => {
                notationWhite
                    .append("div")
                    .attr("class", "notaionRow")
                    .append("text")
                    .text(nw);
            })
        }

        function chessBoradSelection(values) {
            const select = document.createElement("select");
            select.className = "selectColorScheme";

            // Add options
            values.forEach(function (value) {
                const option = document.createElement("option");
                option.text = value.title;
                option.value = value.value;
                select.add(option);
            });

            // Add event listener
            select.addEventListener("change", function (val) {
                selectedColors = select.value;
                loadChessBoard();
                loadChessCaptureView();
            });
            // Append select in button Container
            footerButtonContainer.appendChild(select);
        }

        function chessPiecesSelection(values) {
            // Select ColorScheme
            const select = document.createElement("select");
            select.className = "selectColorScheme";

            // Add options
            values.forEach(function (value) {
                const option = document.createElement("option");
                option.text = value.title;
                option.value = value.value;
                select.add(option);
            });

            // Add event listener
            select.addEventListener("change", function (val) {
                selectedChessPieces = select.value;
                positionData = positionData.map((p) => {
                    p.image = `./images/${selectedChessPieces}/${p.piece}.png`;
                    return p;
                });
                capturedListBlack.map((p) => {
                    p.image = `./images/${selectedChessPieces}/${p.piece}.png`;
                });
                capturedListWhite.map((p) => {
                    p.image = `./images/${selectedChessPieces}/${p.piece}.png`;
                });
                loadChessPieces();
                loadChessCaptureView();
            });
            // Append select in button Container
            footerButtonContainer.appendChild(select);
        }

        // ======= Click ========
        function chessBoxClick(event) {
            // Check is any suggested boxes
            if (suggestedPath.length) {
                const boxId = event.target.id;
                // Check is click on suggested boxes
                const isInSelectedPath = suggestedPath.find((s) => `r${s.row}${s.column}` === boxId);
                if (isInSelectedPath != undefined) {
                    positionData = positionData.map((p) => {
                        if (p.id === selectedPieces) {
                            // Update the chess pieces position
                            d3.selectAll(`#${selectedPieces}`)
                                .transition()
                                .duration(400)
                                .attr("x", () => (boxId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                .attr("y", () => (8 - parseInt(boxId.slice(1, 2))) * 100 + (squareSize / 5));

                            p.place = boxId.slice(1);
                            p.row = boxId.slice(1, 2);
                            p.column = boxId.slice(2);
                            p.isFirst = false;
                        }
                        return p;
                    });

                    clearSelection();

                    positionData.forEach((p) => {
                        if (p.id === selectedPieces) {
                            notationText = `${notationKeys(p.piece.slice(6))}${p.column}${p.row}`;

                            // notation.pieceType = notationKeys(p.piece.slice(6));
                            // notation.place = `${p.column}${p.row}`;

                            // Check & notation 
                            promotion(p);

                            changeTurn();
                            // Show notation
                            p.type === "BLACK" ?
                                notationListBlack.push(notationText) :
                                notationListWhite.push(notationText);
                            loadChessNotationView();
                        }
                    })

                }
                if (suggestedCastle.length) {
                    const isInCastlePath = suggestedCastle.find((s) => `r${s.row}${s.column}` === boxId);
                    if (isInCastlePath != undefined) {
                        positionData = positionData.map((p) => {
                            if (p.id === selectedPieces) {
                                // King
                                d3.selectAll(`#${selectedPieces}`)
                                    .transition()
                                    .duration(400)
                                    .attr("x", () => (boxId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                    .attr("y", () => (8 - parseInt(boxId.slice(1, 2))) * 100 + (squareSize / 5));

                                p.place = boxId.slice(1);
                                p.row = boxId.slice(1, 2);
                                p.column = boxId.slice(2);
                                p.isFirst = false;
                            }
                            return p;
                        })
                        // Rook
                        let rookId, selectionId;
                        switch (boxId.slice(1)) {
                            case "8g":
                                rookId = 'r8f';
                                selectionId = 'c23';
                                d3.selectAll(`#${selectionId}`)
                                    .transition()
                                    .duration(400)
                                    .attr("x", () => (rookId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                    .attr("y", () => (8 - parseInt(rookId.slice(1, 2))) * 100 + (squareSize / 5));

                                positionData = positionData.map((p) => {
                                    if (p.id === selectionId) {
                                        p.place = rookId.slice(1);
                                        p.row = rookId.slice(1, 2);
                                        p.column = rookId.slice(2);
                                        p.isFirst = false;
                                    }
                                    return p;
                                });
                                notationListBlack.push(notationKeys('KingSideCastling'));

                                break;
                            case "8c":
                                rookId = 'r8d'
                                selectionId = 'c16';
                                d3.selectAll(`#${selectionId}`)
                                    .transition()
                                    .duration(400)
                                    .attr("x", () => (rookId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                    .attr("y", () => (8 - parseInt(rookId.slice(1, 2))) * 100 + (squareSize / 5));

                                positionData = positionData.map((p) => {
                                    if (p.id === selectionId) {
                                        p.place = rookId.slice(1);
                                        p.row = rookId.slice(1, 2);
                                        p.column = rookId.slice(2);
                                        p.isFirst = false;
                                    }
                                    return p;
                                });

                                notationListBlack.push(notationKeys('QueenSideCastling'))
                                break;
                            case "1g":
                                rookId = 'r1f'
                                selectionId = 'c7';
                                d3.selectAll(`#${selectionId}`)
                                    .transition()
                                    .duration(400)
                                    .attr("x", () => (rookId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                    .attr("y", () => (8 - parseInt(rookId.slice(1, 2))) * 100 + (squareSize / 5));

                                positionData = positionData.map((p) => {
                                    if (p.id === selectionId) {
                                        p.place = rookId.slice(1);
                                        p.row = rookId.slice(1, 2);
                                        p.column = rookId.slice(2);
                                        p.isFirst = false;
                                    }
                                    return p;
                                });

                                notationListWhite.push(notationKeys('KingSideCastling'));
                                break;
                            case "1c":
                                rookId = 'r1d'
                                selectionId = 'c0';
                                d3.selectAll(`#${selectionId}`)
                                    .transition()
                                    .duration(400)
                                    .attr("x", () => (rookId.slice(2).charCodeAt(0) - 97) * 100 + (squareSize / 5))
                                    .attr("y", () => (8 - parseInt(rookId.slice(1, 2))) * 100 + (squareSize / 5));

                                positionData = positionData.map((p) => {
                                    if (p.id === selectionId) {
                                        p.place = rookId.slice(1);
                                        p.row = rookId.slice(1, 2);
                                        p.column = rookId.slice(2);
                                        p.isFirst = false;
                                    }
                                    return p;
                                });

                                notationListWhite.push(notationKeys('QueenSideCastling'));
                                break;
                        }
                        loadChessNotationView();
                        clearSelection();
                        changeTurn();
                    }
                }
            }
            isDraw(turn);
            chessMessage
                .select("#warningMessage")
                .remove();
            isCheckKing(turn);
        }

        function chessPieceClick(event, d) {
            if (d.type === turn) {
                selectedPieces = d.id;
                if (kingAttackBy) {
                    clearSelection();
                    const rowIndex = row.findIndex((r) => r === d.row);
                    const colIndex = column.findIndex((c) => c === d.column);
                    const selectionValue = d.type === "BLACK" ? 1 : -1;
                    const selectionColor = d.type === "BLACK" ? selectionColorForBlack : selectionColorForWhite;
                    const chessPiece = d.piece.slice(6);
                    const attackerPiece = kingAttackBy.piece.slice(6);

                    // ==============================================================
                    // ===============         Protact         ======================
                    // ==============================================================
                    if (attackerPiece === "QUEEN" || attackerPiece === "ROOK" || attackerPiece === "BISHOP") {
                        // Find the capture path
                        const rowIndexRBQ = row.findIndex((r) => r === kingAttackBy.row);
                        const colIndexRBQ = column.findIndex((c) => c === kingAttackBy.column);
                        let suggestedPathRBQ = [];

                        // Suggested capturing path
                        for (let i = 0; i < chessmoves[attackerPiece].x.length; i++) {
                            let newRow = rowIndexRBQ;
                            let newColumn = colIndexRBQ;
                            suggestedPathRBQ = [];
                            for (let j = 1; j <= arraySize; j++) {
                                newRow += chessmoves[attackerPiece].x[i];
                                newColumn += chessmoves[attackerPiece].y[i];

                                if (row[newRow] === undefined || column[newColumn] === undefined) break;
                                suggestedPathRBQ.push({ id: kingAttackBy.id, row: row[newRow], column: column[newColumn] });
                            }
                            const isCapturedPath = suggestedPathRBQ.find((s) => s.row === kingOnAttack.row && s.column === kingOnAttack.column);
                            if (isCapturedPath) {
                                const kingIndex = suggestedPathRBQ.findIndex((s) => s.row === kingOnAttack.row && s.column === kingOnAttack.column);
                                suggestedPathRBQ = suggestedPathRBQ.slice(0, kingIndex);
                                break;
                            }
                        }

                        // suggestedPathRBQ = suggestedPathRBQ.filter((s) => s.row != kingOnAttack.row && s.column != kingOnAttack.column);
                        // Protact king
                        if (chessPiece === "PAWN") {
                            // move
                            const suggestedPathPawn = [];
                            suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex] });
                            suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (2 * selectionValue)], column: column[colIndex] });

                            const anyOpstical = positionData.find((p) => p.row === suggestedPathPawn[0].row && p.column === suggestedPathPawn[0].column);

                            if (!anyOpstical) {
                                const protactResult = suggestedPathRBQ.find((s) => {
                                    return suggestedPathPawn.find((p) => p.row === s.row && p.column === s.column);
                                })
                                if (protactResult) {
                                    suggestedPath.push(protactResult);
                                }
                            }
                        }
                        else if (chessPiece === "KNIGHT") {
                            let suggestedPathKnight = [];
                            for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                                suggestedPathKnight.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                            const protactResult = suggestedPathRBQ.filter((s) => {
                                return suggestedPathKnight.find((p) => p.row === s.row && p.column === s.column);
                            });

                            if (protactResult.length) suggestedPath.push(...protactResult);
                        }
                        else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                            let suggestedPath2 = [];
                            for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                let newRow = rowIndex;
                                let newColumn = colIndex;

                                for (let j = 1; j <= arraySize; j++) {
                                    newRow += chessmoves[chessPiece].x[i];
                                    newColumn += chessmoves[chessPiece].y[i];

                                    let result2 = positionData.filter((p) => {
                                        return p.row === row[newRow] && p.column === column[newColumn];
                                    }).length;

                                    if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                    suggestedPath2.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                                }
                            }

                            const protactResult = suggestedPathRBQ.filter((s) => {
                                return suggestedPath2.find((p) => p.row === s.row && p.column === s.column);
                            })
                            if (protactResult) suggestedPath.push(...protactResult);
                        }
                    }

                    // ==============================================================
                    // ===============         Capture         ======================
                    // ==============================================================
                    if (chessPiece === "PAWN") {
                        // Capture
                        const suggestedCapturePawn = [];
                        suggestedCapturePawn.push({ id: kingAttackBy.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                        suggestedCapturePawn.push({ id: kingAttackBy.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                        const result = suggestedCapturePawn.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                        if (result) suggestedCapture.push(result);
                    }
                    else if (chessPiece === "KNIGHT") {
                        // Capture
                        const suggestedPathKnight = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                            suggestedPathKnight.push({ id: kingAttackBy.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                        const result = suggestedPathKnight.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                        if (result) suggestedCapture.push(result);
                    }
                    else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                        let suggestedPath = [];
                        let suggestedCaptureRBQ = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                            let newRow = rowIndex;
                            let newColumn = colIndex;

                            for (let j = 1; j <= arraySize; j++) {
                                newRow += chessmoves[chessPiece].x[i];
                                newColumn += chessmoves[chessPiece].y[i];

                                let result2 = positionData.filter((p) => {
                                    if (p.row === row[newRow] && p.column === column[newColumn] && d.type != p.type)
                                        suggestedCaptureRBQ.push({ id: kingAttackBy.id, row: row[newRow], column: column[newColumn] });

                                    return p.row === row[newRow] && p.column === column[newColumn];
                                }).length;

                                if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                            }
                        }
                        const result = suggestedCaptureRBQ.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                        if (result) suggestedCapture.push(result);
                    }
                    else if (chessPiece === "KING") {
                        // ==============================================================
                        // ===============         Run away        ======================
                        // ==============================================================
                        let suggestedPathForKing = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                            suggestedPathForKing.push({ id: kingOnAttack.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                        // Remove undefine values
                        suggestedPathForKing = suggestedPathForKing.filter((s) => s.row != undefined && s.column != undefined);

                        // Remove position which haveing opsiticals
                        suggestedPathForKing = suggestedPathForKing.map((s) => {
                            if (!positionData.filter((p) => {
                                return p.row === s.row && p.column === s.column;
                            }).length) {
                                return s;
                            }
                        });
                        // Remove undefine values
                        suggestedPathForKing = suggestedPathForKing.filter((s) => s != undefined);
                        const oppositeChessPieces = positionData.filter((p) => p.type != kingOnAttack.type);

                        oppositeChessPieces.forEach((d) => {
                            const rowIndex = row.findIndex((r) => r === d.row);
                            const colIndex = column.findIndex((c) => c === d.column);
                            const selectionValue = d.type === "BLACK" ? 1 : -1;

                            const chessPiece = d.piece.slice(6);
                            if (chessPiece === "PAWN") {
                                let suggestedPathPawn = [];
                                suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                                suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                                if (suggestedPathPawn.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPathPawn.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                            else if (chessPiece === "KNIGHT") {
                                let suggestedPathKnight = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                                    suggestedPathKnight.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                                // Get the empty suggeted places and filterout the undefine values
                                suggestedPathKnight = suggestedPathKnight.filter((sk) => {
                                    return !(positionData.find((p) => p.row === sk.row && p.column === sk.column)) && sk.row != undefined && sk.column != undefined;
                                })

                                if (suggestedPathKnight.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPathKnight.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                            else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                                let suggestedPath = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                    let newRow = rowIndex;
                                    let newColumn = colIndex;

                                    for (let j = 1; j <= arraySize; j++) {
                                        newRow += chessmoves[chessPiece].x[i];
                                        newColumn += chessmoves[chessPiece].y[i];

                                        let result2 = positionData.filter((p) => {
                                            return (p.row === row[newRow] && p.column === column[newColumn])
                                            // && (p.row != kingOnAttack.row && p.column != kingOnAttack.column);
                                        }).length;

                                        if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                        suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                                    }
                                }
                                if (suggestedPath.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPath.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                        });
                        suggestedPath = suggestedPathForKing;

                        // ==============================================================
                        // ===============   Capture by king       ======================
                        // ==============================================================
                        let suggestedPathKing = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                            suggestedPathKing.push({
                                id: kingAttackBy.id,
                                row: row[rowIndex + chessmoves[chessPiece].x[i]],
                                column: column[colIndex + chessmoves[chessPiece].y[i]]
                            });
                        }

                        // suggestedPathKing = positionData.filter((p) => {
                        //     return suggestedPathKing.find((f) => p.row === f.row && p.column === f.column) && p.type === kingAttackBy.type;
                        // });

                        let kingResult = suggestedPathKing.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                        if (kingResult) {
                            oppositeChessPieces.forEach((d) => {
                                const rowIndex = row.findIndex((r) => r === d.row);
                                const colIndex = column.findIndex((c) => c === d.column);
                                const selectionValue = d.type === "BLACK" ? 1 : -1;
                                const chessPiece = d.piece.slice(6);

                                if (chessPiece === "PAWN") {
                                    const suggestedCapturePawn = [];
                                    suggestedCapturePawn.push({ id: kingAttackBy.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                                    suggestedCapturePawn.push({ id: kingAttackBy.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                                    const result2 = suggestedCapturePawn.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                                    if (result2) kingResult = null;
                                }
                                else if (chessPiece === "KNIGHT") {
                                    const suggestedCaptureKnight = [];
                                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                                        suggestedCaptureKnight.push({ id: kingAttackBy.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                                    const result2 = suggestedCaptureKnight.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                                    if (result2) kingResult = null;
                                }
                                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                                    const suggestedPath = [];
                                    const suggestedCapture = [];
                                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                        let newRow = rowIndex;
                                        let newColumn = colIndex;

                                        for (let j = 1; j <= arraySize; j++) {
                                            newRow += chessmoves[chessPiece].x[i];
                                            newColumn += chessmoves[chessPiece].y[i];

                                            let result2 = positionData.filter((p) => {
                                                if (p.row === row[newRow] && p.column === column[newColumn])
                                                    suggestedCapture.push({ id: kingAttackBy.id, row: row[newRow], column: column[newColumn] });

                                                return p.row === row[newRow] && p.column === column[newColumn];
                                            }).length;

                                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                            suggestedPath.push({ id: kingAttackBy.id, row: row[newRow], column: column[newColumn] });
                                        }
                                    }
                                    const result2 = suggestedCapture.find((s) => s.column === kingAttackBy.column && s.row === kingAttackBy.row);
                                    if (result2) kingResult = null;
                                }
                            });
                        };
                        if (kingResult) {
                            suggestedCapture.push(kingResult)
                        }
                        // else {
                        //     suggestedCapture = suggestedPathKing;
                        // };
                    }
                    // kingAttackBy = null;
                    showCapturePath();
                    showSuggestedPaths(selectionColor);
                    pieceSelection(d, selectionColor);
                } else {
                    clearSelection();
                    stepSuggetion(d);
                    if (d.piece.slice(6) === "KING") castling(d);
                }
            }
            else {
                const opponent = event.srcElement.__data__;
                if (suggestedCapture.length) {
                    const result = suggestedCapture.find((s) => s.id === opponent.id);
                    if (result != undefined) {
                        d3.select(`#${opponent.id}`)
                            .transition()
                            .remove();

                        positionData = positionData.filter((p) => !(p.id === opponent.id));

                        // Update the position of selected pieces with opponent
                        d3.selectAll(`#${selectedPieces}`)
                            .transition()
                            .duration(500)
                            // .delay(100)
                            // .ease(d3.easeBounceOut)
                            .attr("x", () => (opponent.column.charCodeAt(0) - 97) * 100 + (squareSize / 5))
                            .attr("y", () => (8 - parseInt(opponent.row)) * 100 + (squareSize / 5));

                        positionData = positionData.map((p) => {
                            if (p.id === selectedPieces) {
                                // Update the positionData array
                                p.place = opponent.row + opponent.column;
                                p.row = opponent.row;
                                p.column = opponent.column;
                                p.isFirst = false;
                            }
                            return p;
                        });

                        clearSelection();

                        positionData.forEach((p) => {
                            if (p.id === selectedPieces) {
                                notationText = `${notationKeys(p.piece.slice(6))}${notationKeys("Capture")}${p.column}${p.row}`;

                                // notation.pieceType = notationKeys(p.piece.slice(6));
                                // notation.moveType = notationKeys("Capture");
                                // notation.place = `${p.column}${p.row}`;

                                // Check & CheckMate & notation
                                promotion(p);
                                if (opponent.piece.includes("KING")) isCheckMate(p);
                                changeTurn();
                                isDraw(turn);

                                // Show notation
                                p.type === "BLACK" ?
                                    notationListBlack.push(notationText) :
                                    notationListWhite.push(notationText);
                                loadChessNotationView();

                                // Show Captured pieces 
                                opponent.type === "BLACK" ?
                                    capturedListBlack.push(opponent) :
                                    capturedListWhite.push(opponent);
                                loadChessCaptureView();
                            }
                        });
                    }
                    isCheckKing(turn);
                }
            }

        }

        // ======= Suggetion Steps/Capture ========
        function stepSuggetion(d) {
            const rowIndex = row.findIndex((r) => r === d.row);
            const colIndex = column.findIndex((c) => c === d.column);
            const selectionColor = d.type === "BLACK" ? selectionColorForBlack : selectionColorForWhite;
            const selectionValue = d.type === "BLACK" ? 1 : -1;
            // Clear the variables and board and set the selection
            loadChessBoard();
            suggestedPath = [];
            suggestedCapture = [];
            pieceSelection(d, selectionColor);

            const chessPiece = d.piece.slice(6);
            if (chessPiece === "PAWN")
                pownMoves(selectionColor, rowIndex, colIndex, d, selectionValue);
            else if (chessPiece === "KING" || chessPiece === "KNIGHT")
                KNMoves(selectionColor, rowIndex, colIndex, d, chessmoves[chessPiece].x, chessmoves[chessPiece].y);
            else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN")
                RBQMoves(selectionColor, rowIndex, colIndex, d, chessmoves[chessPiece].x, chessmoves[chessPiece].y);
        }

        function checkAnyOpsticalKNP(selectedPiece) {
            suggestedPath = suggestedPath.filter((s) => {
                // filterout suggetion path that having no opstical and row&column not undefine
                return !positionData.filter((p) => {
                    // filterout capture path exept pawn
                    if (p.row === s.row
                        && p.column === s.column
                        && p.type != turn
                        && selectedPiece.piece.slice(6) != "PAWN")
                        suggestedCapture.push(p);

                    return p.row === s.row && p.column === s.column;
                }).length
                    && s.row !== undefined
                    && s.column !== undefined;
            });

            // Checking the opstical of pawn while it have isFirst true
            if (selectedPiece.piece.slice(6) === "PAWN" && selectedPiece.isFirst === true) {
                let result = positionData.filter((p) => {
                    if (selectedPiece.type === "BLACK") {
                        return p.row == parseInt(selectedPiece.row) - 1 && p.column === selectedPiece.column;
                    } else {
                        return p.row == parseInt(selectedPiece.row) + 1 && p.column === selectedPiece.column;
                    }
                });
                if (result.length) suggestedPath = [];
            }

            if (selectedPiece.piece.slice(6) === "KING") {
                const oppositeChessPieces = positionData.filter((p) => p.type != selectedPiece.type);
                let suggestedPathForKing = suggestedPath;

                oppositeChessPieces.forEach((d) => {
                    const rowIndex = row.findIndex((r) => r === d.row);
                    const colIndex = column.findIndex((c) => c === d.column);
                    const selectionValue = d.type === "BLACK" ? 1 : -1;

                    const chessPiece = d.piece.slice(6);
                    if (chessPiece === "PAWN") {
                        let suggestedPathPawn = [];
                        suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                        suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                        if (suggestedPathPawn.length) {
                            suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                return !suggestedPathPawn.find((sd) => sp.row === sd.row && sp.column === sd.column);
                            });
                        }
                    }
                    else if (chessPiece === "KNIGHT" || chessPiece === "KING") {
                        let suggestedPathKnight = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                            suggestedPathKnight.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                        // Get the empty suggeted places and filterout the undefine values
                        suggestedPathKnight = suggestedPathKnight.filter((sk) => {
                            return !(positionData.find((p) => p.row === sk.row && p.column === sk.column)) && sk.row != undefined && sk.column != undefined;
                        })

                        if (suggestedPathKnight.length) {
                            suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                return !suggestedPathKnight.find((sd) => sp.row === sd.row && sp.column === sd.column);
                            });
                        }
                    }
                    else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                        let suggestedPath = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                            let newRow = rowIndex;
                            let newColumn = colIndex;

                            for (let j = 1; j <= arraySize; j++) {
                                newRow += chessmoves[chessPiece].x[i];
                                newColumn += chessmoves[chessPiece].y[i];

                                let result2 = positionData.filter((p) => {
                                    return p.row === row[newRow] && p.column === column[newColumn];
                                }).length;

                                if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                            }
                        }
                        if (suggestedPath.length) {
                            suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                return !suggestedPath.find((sd) => sp.row === sd.row && sp.column === sd.column);
                            });
                        }
                    }
                });

                suggestedPath = suggestedPathForKing;
            }

            showCapturePath();
        }

        function pownMoves(color, rowIndex, colIndex, d, val) {
            suggestedPath.push({ id: d.id, row: row[rowIndex + (1 * val)], column: d.column }); // Add 1st row 
            if (d.isFirst) suggestedPath.push({ id: d.id, row: row[rowIndex + (2 * val)], column: d.column }); // Add 2nd row

            checkAnyOpsticalKNP(d);
            showSuggestedPaths(color);

            // Check for the suggested capture path
            suggestedCapture = positionData.filter((p) =>
                p.row === row[rowIndex + (1 * val)]
                && p.type != turn
                && p.column != column[colIndex]
                && (p.column === column[colIndex + 1]
                    || p.column === column[colIndex - 1]));

            showCapturePath();
            isCheckMatePossible(d);
        }

        function KNMoves(color, rowIndex, colIndex, d, x, y) {
            for (let i = 0; i < x.length; i++)
                suggestedPath.push({ id: d.id, row: row[rowIndex + x[i]], column: column[colIndex + y[i]] });

            checkAnyOpsticalKNP(d);
            showSuggestedPaths(color);
            if (d.piece.slice(6) !== "KING") isCheckMatePossible(d);
        }

        function RBQMoves(color, rowIndex, colIndex, d, x, y) {
            for (let i = 0; i < x.length; i++)
                moveLoopsRBQ(rowIndex, colIndex, d, x[i], y[i]);

            showSuggestedPaths(color);
            isCheckMatePossible(d);
        }

        function moveLoopsRBQ(rowIndex, colIndex, d, rowChange, columnChange) {
            let newRow = rowIndex;
            let newColumn = colIndex;

            for (let i = 1; i <= arraySize; i++) {
                // RowChange and columnChange is for direction to go
                newRow += rowChange;
                newColumn += columnChange;

                // Fetch the suggested paths
                let result = positionData.filter((p) => {
                    if (p.row === row[newRow] && p.column === column[newColumn] && p.type != turn) suggestedCapture.push(p); // Check for capture boxes (or chess pieces)
                    return p.row === row[newRow] && p.column === column[newColumn];
                }).length;

                if (row[newRow] === undefined || column[newColumn] === undefined || result) break; // Filterout undefined values
                suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
            }
            showCapturePath();
        }

        function isCheckMatePossible(d) {
            const opponet = positionData.filter((p) =>
                p.type != d.type && (
                    p.piece.slice(6) === 'QUEEN' ||
                    p.piece.slice(6) === 'ROOK' ||
                    p.piece.slice(6) === 'BISHOP'));

            let suggestedPathOfOpponet = [];
            let suggestedOpponet = null;

            opponet.forEach((o) => {
                // Find the capture path
                const rowIndexRBQ = row.findIndex((r) => r === o.row);
                const colIndexRBQ = column.findIndex((c) => c === o.column);
                let suggestedPathRBQ = [];

                for (let i = 0; i < chessmoves[o.piece.slice(6)].x.length; i++) {
                    let newRow = rowIndexRBQ;
                    let newColumn = colIndexRBQ;
                    suggestedPathRBQ = [];
                    for (let j = 1; j <= arraySize; j++) {
                        newRow += chessmoves[o.piece.slice(6)].x[i];
                        newColumn += chessmoves[o.piece.slice(6)].y[i];

                        if (row[newRow] === undefined || column[newColumn] === undefined) break;
                        suggestedPathRBQ.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                    }

                    const capturePiece = positionData.filter((p) => {
                        return suggestedPathRBQ.find((s) => s.row === p.row && p.column === s.column && p.type === d.type);
                    })

                    const isKingOnRadar = capturePiece.find((c) => c.piece.slice(6) === "KING");
                    if (isKingOnRadar) {
                        suggestedPathOfOpponet = suggestedPathRBQ;
                        suggestedOpponet = o;
                        break;
                    }
                }
            })

            const isPieceOpstical = suggestedPathOfOpponet.find((sp) => sp.row === d.row && sp.column === d.column);
            if (suggestedPathOfOpponet.length && isPieceOpstical) {
                // Get the opsticals
                const kingDetail = positionData.find((d) => d.piece.slice(6) === "KING" && d.type === turn);
                const kingIndex = suggestedPathOfOpponet.findIndex((s) => s.row === kingDetail.row && s.column === kingDetail.column);
                suggestedPathOfOpponet = suggestedPathOfOpponet.slice(0, kingIndex);
                const opsticals = positionData.filter((p) => {
                    return suggestedPathOfOpponet.find((s) => s.row === p.row && p.column === s.column);
                });

                if (opsticals.length != 1) return;
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionColor = d.type === "BLACK" ? selectionColorForBlack : selectionColorForWhite;
                const selectionValue = d.type === "BLACK" ? 1 : -1;
                const chessPiece = d.piece.slice(6);
                loadChessBoard();
                suggestedPath = [];
                suggestedCapture = [];
                pieceSelection(d, selectionColor);
                if (chessPiece === "PAWN") {
                    // Capture
                    const suggestedCapturePawn = [];
                    suggestedCapturePawn.push({ id: suggestedOpponet.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                    suggestedCapturePawn.push({ id: suggestedOpponet.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                    const captureResult = suggestedCapturePawn.filter((s) => s.column === suggestedOpponet.column && s.row === suggestedOpponet.row);
                    if (captureResult.length) {
                        suggestedCapture = captureResult;
                        showCapturePath();
                    } else {
                        suggestedCapture = [];
                    };

                    // Move 
                    const suggestedPathPawn = [];
                    suggestedPathPawn.push({ id: suggestedOpponet.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex] });
                    suggestedPathPawn.push({ id: suggestedOpponet.id, row: row[rowIndex + (2 * selectionValue)], column: column[colIndex] });

                    const pathResult = suggestedPathPawn.filter((s) => {
                        return suggestedPathOfOpponet.find((sp) => sp.column === s.column && sp.row === s.row)
                    })
                    if (pathResult.length) {
                        suggestedPath = pathResult;
                        showSuggestedPaths(selectionColor);
                    } else {
                        suggestedPath = [];
                    };
                }
                else if (chessPiece === "KNIGHT") {
                    // capture and move
                    showCapturePath();
                    showSuggestedPaths(selectionColor);
                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    // Capture
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                if (p.row === row[newRow] && p.column === column[newColumn])
                                    suggestedCapture.push({ id: p.id, row: row[newRow], column: column[newColumn] });

                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                        }
                    }

                    const captureResult = suggestedCapture.filter((s) => s.column === suggestedOpponet.column && s.row === suggestedOpponet.row);
                    if (captureResult.length) {
                        suggestedCapture = captureResult;
                        showCapturePath();
                    } else {
                        suggestedCapture = [];
                    };

                    // Move
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                            suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                        }
                    }

                    const pathResult = suggestedPath.filter((s) => {
                        return suggestedPathOfOpponet.find((sp) => sp.column === s.column && sp.row === s.row)
                    })
                    if (pathResult.length) {
                        suggestedPath = pathResult;
                        showSuggestedPaths(selectionColor);
                    } else {
                        suggestedPath = [];
                    }
                }
            }
        }

        // ======= Show ========
        function pieceSelection(d, selectionColor) {
            // suggestedPath = [];
            // suggestedCapture = [];
            d3.select(`#r${d.row}${d.column}`).style("fill", selectionColor);
        }

        function showCapturePath() {
            suggestedCapture.forEach((s) => {
                d3.select(`#r${s.row}${s.column}`).style("fill", "red");
            });
        }

        function showSuggestedPaths(color) {
            suggestedPath.forEach((s) => {
                d3.select(`#r${s.row}${s.column}`).style("fill", color);
            });
        }

        function showSuggestedCastle() {
            suggestedCastle.forEach((s) => {
                d3.select(`#r${s.row}${s.column}`).style("fill", "steelBlue");
            });
        }

        function showWarningMessage(captureKing, attacker) {
            chessMessage
                .select("#warningMessage")
                .remove();

            // notationText += '+';
            attacker.type === "BLACK" ?
                notationListBlack = notationListBlack.map((d, i) => {
                    if (i === (notationListBlack.length - 1)) {
                        if (d.slice(d.length - 1) != '+')
                            d += `+`;
                    }
                    return d;
                }) :
                notationListWhite = notationListWhite.map((d, i) => {
                    if (i === (notationListWhite.length - 1)) {
                        if (d.slice(d.length - 1) != '+')
                            d += `+`;
                    }
                    return d;
                });

            loadChessNotationView();
            // notation.check = '+';
            chessMessage
                .append("text")
                .attr("class", "warningMessage")
                .attr("id", "warningMessage")
                .text(`The ${captureKing.piece.slice(0, 5).toLowerCase()} king is under attack!`);

            d3.select(`#r${captureKing.row}${captureKing.column}`).style("fill", "red");
            isKingCheckMate(captureKing, attacker);
        }

        // ======= Drag&Drop ========
        function dragStart(event) {
            stepSuggetion(event.subject)
        }

        function handleDrag(event) {
            event.subject.x = event.x;
            event.subject.y = event.y;
            d3
                .select(`#c${event.subject.place}`)
                .attr("x", event.x)
                .attr("y", event.y)
        }

        function dragged(event) {
            // // const targetCheckbox = event.target;
            // // const checkboxRect = targetCheckbox.container;
            // const targetRect = event.target;
            // const rectNode = targetRect.node; // Get the underlying DOM element
            // const rectRect = rectNode.getBoundingClientRect; // Call getBoundingClientRect on the DOM element
            // loadChessBoard()
        }

        // =========== Modal =============

        function openModal(type, selectedPiece = undefined) {
            modal.style.display = "block";
            modelButtonContainer.innerHTML = '';
            if (type === "promotion") pawnPromotionModel();
            else if (type === "checkMate") showcheckMateModel(selectedPiece);
        }

        function showcheckMateModel(selectedPiece) {
            modelTitle.textContent = "Checkmate";
            const div = document.createElement("div");
            div.className = "checkMateModelContainer";

            const img = document.createElement("img");
            img.src = `./images/other/WIN_${selectedPiece.type}.png`;
            img.alt = selectedPiece.type;

            div.appendChild(img);
            modelButtonContainer.appendChild(div);

            const h5 = document.createElement("h5");
            h5.textContent = `${selectedPiece.type} WINS`
            modelButtonContainer.appendChild(h5);

            const hr = document.createElement("hr");
            modelButtonContainer.appendChild(hr);

            const footerDiv = document.createElement("div");
            footerDiv.className = "checkMateFooterContainer";

            const button = document.createElement("button");
            button.addEventListener("click", resetGame);
            button.textContent = "Restart";

            footerDiv.appendChild(button);
            modelButtonContainer.appendChild(footerDiv);
        }

        function pawnPromotionModel() {
            modelTitle.textContent = "Pawn Promotion";
            const buttonImages = promotionOptions.map((p) => `${pawnPromotion.type}_${p}`.toUpperCase());
            buttonImages.forEach(function (imageSrc, index) {
                const button = document.createElement("button");
                button.addEventListener("click", promotPawn);
                button.className = "promotionImageButton";
                const img = document.createElement("img");
                img.src = `./images/${selectedChessPieces}/${imageSrc}.png`;
                img.alt = imageSrc;
                button.appendChild(img);
                modelButtonContainer.appendChild(button);
            });
        }

        function isCheckMate(selectedPiece) {
            openModal("checkMate", selectedPiece);
        }

        function promotion(selectedPiece) {
            if (selectedPiece.piece.slice(6) === "PAWN") {
                if (selectedPiece.row == 8 || selectedPiece.row == 1) {
                    pawnPromotion = selectedPiece;
                    openModal("promotion");
                }
            }
        }

        function drawModel() {
            modelTitle.textContent = "Draw";
            const div = document.createElement("div");
            div.className = "checkMateModelContainer";

            const img = document.createElement("img");
            img.src = `./images/other/draw2.jpg`;
            img.alt = 'draw';

            div.appendChild(img);
            modelButtonContainer.appendChild(div);

            const h5 = document.createElement("h5");
            h5.textContent = 'Settlement!'
            modelButtonContainer.appendChild(h5);

            const hr = document.createElement("hr");
            modelButtonContainer.appendChild(hr);

            const footerDiv = document.createElement("div");
            footerDiv.className = "checkMateFooterContainer";

            const button = document.createElement("button");
            button.addEventListener("click", resetGame);
            button.textContent = "Restart";

            footerDiv.appendChild(button);
            modelButtonContainer.appendChild(footerDiv);
        }

        function closeModal() {
            modal.style.display = "none";
        }

        // ======= Other ========
        function clearSelection() {
            suggestedPath = [];
            suggestedCapture = [];
            suggestedCastle = [];
            loadChessBoard();
        }

        function changeTurn() {
            turn = (turn === "BLACK") ? "WHITE" : "BLACK";
            turnLable
                .text(`${turn}'s turn`)
                .attr("class", turn);
            highlightTurn(turn);
        }

        function highlightTurn(turn) {
            const ownPieces = positionData.filter((p) => p.type === turn);
            ownPieces.forEach((d) => {
                chessBlocks
                    .select(`#r${d.row}${d.column}`)
                    .transition()
                    .duration((d, i) => i * 100)
                    // .style("fill", "url(#radial-gradient)")
                    .style("stroke", "yellow")
                    .style("stroke-width", 5)
            })
            // d3.select("body")
            //     .transition()
            //     .duration(500)
            //     .style("background-color", () => (turn === "WHITE") ? "white" : "black")
            //     .style("color", () => (turn === "WHITE") ? "black" : "white")

            // setTimeout(function () {
            //     loadChessBoard();
            //     chessMessage
            //         .select("#warningMessage")
            //         .remove();
            //     }, 5000);
        }

        function resetGame() {
            suggestedPath = [];
            suggestedCapture = [];
            notationListWhite = [];
            notationListBlack = [];
            capturedListWhite = [];
            capturedListBlack = [];

            footerButtonContainer.innerHTML = '';
            modelButtonContainer.innerHTML = '';

            svg.selectAll("g").remove();

            turn = "WHITE";
            turnLable
                .text(`${turn}'s turn`)
                .attr("class", turn);

            chessMessage
                .select("#warningMessage")
                .remove();

            selectedChessPieces = 'chess2';

            closeModal();
            loadChessCaptureView();
            loadChessNotationView();
            loadChess();
        }

        // ========= Main functionality =======

        // ====================================
        // Castling
        // ====================================
        function castling(selectedPiece) {
            suggestedCastle = [];
            const selectedType = selectedPiece.type;
            // Is king isFirst
            if (selectedPiece.isFirst) {
                // Is the rook and isFirst
                const result = positionData.filter((p) => (p.piece === `${selectedType}_ROOK` && p.isFirst === true));
                if (result.length) {
                    let kingSideFlag = true;
                    let queenSideFlag = true;
                    castlingPositions[selectedType].KINGSIDE.filter((c) => {
                        const results = positionData.filter((p) => p.row === c.slice(1) && p.column === c.slice(0, 1));
                        if (results.length) kingSideFlag = false;
                    });
                    if (kingSideFlag) {
                        const isAvaible = result.filter((r) => {
                            if (selectedType === "BLACK") {
                                return r.row === '8' && r.column === 'h';
                            } else {
                                return r.row === '1' && r.column === 'h';
                            }
                        });
                        if (isAvaible.length) {
                            if (isCastlingPossible(selectedPiece, selectedType === "BLACK" ? '8' : '1', 'g'))
                                suggestedCastle.push({ row: selectedType === "BLACK" ? '8' : '1', column: 'g' });
                        }
                    }

                    castlingPositions[selectedType].QUEENSIDE.filter((c) => {
                        const results = positionData.filter((p) => p.row === c.slice(1) && p.column === c.slice(0, 1));
                        if (results.length) queenSideFlag = false;
                    });
                    if (queenSideFlag) {
                        const isAvaible = result.filter((r) => {
                            if (selectedType === "BLACK") {
                                return r.row === '8' && r.column === 'a';
                            } else {
                                return r.row === '1' && r.column === 'a';
                            }
                        });
                        if (isAvaible.length) {
                            if (isCastlingPossible(selectedPiece, selectedType === "BLACK" ? '8' : '1', 'c'))
                                suggestedCastle.push({ row: selectedType === "BLACK" ? '8' : '1', column: 'c' });
                        }
                    }
                    showSuggestedCastle();
                }
            }
        }

        function isCastlingPossible(dd, rows, columns) {
            const opponentPieces = positionData.filter((d) => d.type != dd.type);
            let allSuggetedPath = [];
            opponentPieces.forEach((d) => {
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionValue = d.type === "BLACK" ? 1 : -1;
                const chessPiece = d.piece.slice(6);
                let suggestedPathOp = [];

                if (chessPiece === "PAWN") {
                    suggestedPathOp.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                    suggestedPathOp.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });
                    allSuggetedPath.push(...suggestedPathOp);
                }
                else if (chessPiece === "KING" || chessPiece === "KNIGHT") {
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        suggestedPathOp.push({
                            id: d.id,
                            row: row[rowIndex + chessmoves[chessPiece].x[i]],
                            column: column[colIndex + chessmoves[chessPiece].y[i]]
                        });
                    }

                    suggestedPathOp = suggestedPathOp.filter((s) => {
                        return !positionData.filter((p) => {
                            return p.row === s.row && p.column === s.column;
                        }).length
                            && s.row !== undefined
                            && s.column !== undefined;
                    });

                    suggestedPathOp.forEach((s) => {
                        positionData.forEach((p) => {
                            if (p.row === s.row
                                && p.column === s.column
                                && p.type === turn)
                                capturePath.push(p);
                        })
                    });

                    if (suggestedPathOp.length)
                        allSuggetedPath.push(...suggestedPathOp);

                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    // Suggested path
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                            suggestedPathOp.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                        }
                    }
                    if (suggestedPathOp.length)
                        allSuggetedPath.push(...suggestedPathOp);
                }
            })
            const pathResult = allSuggetedPath.find((s) => s.row === rows && s.column === columns);
            return !!!pathResult;
        }

        // ====================================
        // Promotion
        // ====================================
        function promotPawn(event) {
            positionData = positionData.map((p) => {
                if (p.id === pawnPromotion.id) {
                    // Notation
                    p.type === "BLACK" ?
                        notationListBlack = notationListBlack.map((d, i) => {
                            if (i === (notationListBlack.length - 1)) {
                                d += `=${(event.target.alt).slice(6, 7)}`;
                            }
                            return d;
                        }) :
                        notationListWhite = notationListWhite.map((d, i) => {
                            if (i === (notationListWhite.length - 1)) {
                                d += `=${(event.target.alt).slice(6, 7)}`;
                            }
                            return d;
                        });

                    p.piece = event.target.alt;
                    p.image = `./images/${selectedChessPieces}/${event.target.alt}.png`;
                }
                return p;
            })
            isCheckKing(turn)
            loadChessNotationView();
            pawnPromotion = null;
            loadChessPieces();
            closeModal();
        }

        // ====================================
        // Check
        // ====================================
        function isCheckKing(turn) {
            kingAttackBy = null;
            kingOnAttack = null;
            const oppositeChessPieces = positionData.filter((p) => p.type != turn);

            oppositeChessPieces.forEach((d) => {
                let capturePath = [];
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionValue = d.type === "BLACK" ? 1 : -1;
                const chessPiece = d.piece.slice(6);

                if (chessPiece === "PAWN") {

                    // Check for the suggested capture path
                    capturePath = positionData.filter((p) =>
                        p.row === row[rowIndex + (1 * selectionValue)]
                        && p.column != column[colIndex]
                        && p.type === turn
                        && (p.column === column[colIndex + 1]
                            || p.column === column[colIndex - 1]));

                    if (capturePath.length) {
                        let result = capturePath.find((c) => c.piece.slice(6) === "KING");
                        if (result) showWarningMessage(result, d);
                    }
                }
                else if (chessPiece === "KNIGHT") {
                    let suggestedPath1 = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                        suggestedPath1.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                    suggestedPath1.forEach((s) => {
                        positionData.forEach((p) => {
                            if (p.row === s.row
                                && p.column === s.column
                                && p.type === turn)
                                capturePath.push(p);
                        })
                    });
                    if (capturePath.length) {
                        let result = capturePath.find((c) => c.piece.slice(6) === "KING");
                        if (result) showWarningMessage(result, d);
                    }
                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                if (p.row === row[newRow] && p.column === column[newColumn] && p.type === turn) capturePath.push(p);
                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                        }
                    }
                    if (capturePath.length) {
                        let result = capturePath.find((c) => c.piece.slice(6) === "KING");
                        if (result) showWarningMessage(result, d);
                    }
                }
            })
        }

        // ====================================
        // CheckMate
        // ====================================
        function isKingCheckMate(kingOnCheck, attacker) {
            // let capturePossible = false;
            // let isAnyProtactor = false;
            let protactorMoves = [];
            let captureMoves = [];

            const rowIndex = row.findIndex((r) => r === kingOnCheck.row);
            const colIndex = column.findIndex((c) => c === kingOnCheck.column);
            const chessPiece = "KING";

            // Get suggested paths
            let suggestedPathForKing = [];
            let suggestedCaptureForKing = [];

            for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                suggestedPathForKing.push({ id: kingOnCheck.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

            // Remove undefine values
            suggestedPathForKing = suggestedPathForKing.filter((s) => s.row != undefined && s.column != undefined);

            // Remove position which haveing opsiticals
            suggestedPathForKing = suggestedPathForKing.map((s) => {
                if (!positionData.filter((p) => {
                    if (p.row === s.row
                        && p.column === s.column
                        && p.type !== turn)
                        suggestedCaptureForKing.push(p);
                    return p.row === s.row && p.column === s.column;
                }).length) {
                    return s;
                }
            });

            // Remove undefine values
            suggestedPathForKing = suggestedPathForKing.filter((s) => s != undefined);

            // Get the opposite chess pieces
            const oppositeChessPieces = positionData.filter((p) => p.type != kingOnCheck.type);

            // ==================================== 
            // (CPR) Run away- checkout the suggested path of king's that under attack and compare with opposite piecse's 
            // suggseted path if anyone are same as king then remove them from the king's suggestion.
            // If the king suggetion are empty than king not able to run away. 
            // ====================================
            oppositeChessPieces.forEach((d) => {
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionValue = d.type === "BLACK" ? 1 : -1;

                const chessPiece = d.piece.slice(6);
                if (chessPiece === "PAWN") {
                    let suggestedPathPawn = [];
                    suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                    suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                    // Remove attecking path from the King's suggeted paths
                    if (suggestedPathPawn.length) {
                        suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                            return !suggestedPathPawn.find((sd) => sp.row === sd.row && sp.column === sd.column);
                        });
                    }
                }
                else if (chessPiece === "KNIGHT") {
                    let suggestedPathKnight = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                        suggestedPathKnight.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                    // Remove attecking path from the King's suggeted paths
                    if (suggestedPathKnight.length) {
                        suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                            return !suggestedPathKnight.find((sd) => sp.row === sd.row && sp.column === sd.column);
                        });
                    }
                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    let suggestedPath = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                            suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                        }
                    }
                    // Remove attecking path from the King's suggeted paths
                    if (suggestedPath.length) {
                        suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                            return !suggestedPath.find((sd) => sp.row === sd.row && sp.column === sd.column);
                        });
                    }
                }
            })

            // ==================================== 
            // (CPR) Protact- Own pieces that can protact the king (only protact from rook, bishop and queen).  
            // ====================================
            // Get the own pieces
            const ownChessPieces = positionData.filter((p) => p.type === kingOnCheck.type);

            // Checkout any protactor is there
            if (attacker.piece.slice(6) === "QUEEN" || attacker.piece.slice(6) === "BISHOP" || attacker.piece.slice(6) === "ROOK") {
                const rowIndexRBQ = row.findIndex((r) => r === attacker.row);
                const colIndexRBQ = column.findIndex((c) => c === attacker.column);
                let suggestedPathRBQ = [];

                for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                    let newRow = rowIndexRBQ;
                    let newColumn = colIndexRBQ;
                    suggestedPathRBQ = [];
                    for (let j = 1; j <= arraySize; j++) {
                        newRow += chessmoves[chessPiece].x[i];
                        newColumn += chessmoves[chessPiece].y[i];

                        if (row[newRow] === undefined || column[newColumn] === undefined) break;
                        suggestedPathRBQ.push({ id: attacker.id, row: row[newRow], column: column[newColumn] });
                    }
                    // Fetch the capture path of king
                    const isCapturedPath = suggestedPathRBQ.find((s) => s.row === kingOnCheck.row && s.column === kingOnCheck.column);
                    if (isCapturedPath) {
                        const kingIndex = suggestedPathRBQ.findIndex((s) => s.row === kingOnCheck.row && s.column === kingOnCheck.column);
                        suggestedPathRBQ = suggestedPathRBQ.slice(0, kingIndex);
                        break;
                    }
                }

                // Get the suggetion of them
                ownChessPieces.forEach((d) => {
                    const rowIndex = row.findIndex((r) => r === d.row);
                    const colIndex = column.findIndex((c) => c === d.column);
                    const selectionValue = d.type === "BLACK" ? 1 : -1;

                    const chessPiece = d.piece.slice(6);
                    if (chessPiece === "PAWN") {
                        let suggestedPathPawn = [];
                        suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex] });
                        suggestedPathPawn.push({ id: d.id, row: row[rowIndex + (2 * selectionValue)], column: column[colIndex] });

                        const anyOpstical = positionData.find((p) => p.row === suggestedPathPawn[0].row && p.column === suggestedPathPawn[0].column);

                        if (!anyOpstical) {
                            const protactResult = suggestedPathRBQ.find((s) => {
                                return suggestedPathPawn.find((p) => p.row === s.row && p.column === s.column);
                            })
                            if (protactResult) {
                                protactorMoves.push(protactResult);
                                // isAnyProtactor = true;
                            }
                        }
                    }
                    else if (chessPiece === "KNIGHT") {
                        let suggestedPathKnight = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                            suggestedPathKnight.push({ id: d.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                        const protactResult = suggestedPathRBQ.find((s) => {
                            return suggestedPathKnight.find((p) => p.row === s.row && p.column === s.column);
                        })
                        if (protactResult) {
                            protactorMoves.push(protactResult);
                            // isAnyProtactor = true;
                        }
                    }
                    else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                        let suggestedPath = [];
                        for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                            let newRow = rowIndex;
                            let newColumn = colIndex;

                            for (let j = 1; j <= arraySize; j++) {
                                newRow += chessmoves[chessPiece].x[i];
                                newColumn += chessmoves[chessPiece].y[i];

                                let result2 = positionData.filter((p) => {
                                    return p.row === row[newRow] && p.column === column[newColumn];
                                }).length;

                                if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                suggestedPath.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                            }
                        }

                        const protactResult = suggestedPathRBQ.find((s) => {
                            return suggestedPath.find((p) => p.row === s.row && p.column === s.column);
                        })
                        if (protactResult) {
                            protactorMoves.push(protactResult);
                            // isAnyProtactor = true;
                        }
                    }
                });
            }
            // ==================================== 
            // (CPR) Capture- Own piecse can capture the attacker 
            // ====================================

            ownChessPieces.forEach((d) => {
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionValue = d.type === "BLACK" ? 1 : -1;
                const chessPiece = d.piece.slice(6);

                if (chessPiece === "PAWN") {
                    const suggestedCapturePawn = [];
                    suggestedCapturePawn.push({ id: attacker.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                    suggestedCapturePawn.push({ id: attacker.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });
                    const captureResult = suggestedCapturePawn.find((s) => s.column === attacker.column && s.row === attacker.row);

                    // ==========================================================
                    // Logic for checking is pawn is bettween the opponent and king
                    // ==========================================================
                    if (captureResult) {
                        const opponets = positionData.filter((p) =>
                            p.type === attacker.type && (
                                p.piece.slice(6) === 'QUEEN' ||
                                p.piece.slice(6) === 'ROOK' ||
                                p.piece.slice(6) === 'BISHOP'));

                        opponets.forEach((o) => {
                            const rowIndexRBQ = row.findIndex((r) => r === o.row);
                            const colIndexRBQ = column.findIndex((c) => c === o.column);
                            let suggestedPathRBQ = [];

                            for (let i = 0; i < chessmoves[o.piece.slice(6)].x.length; i++) {
                                let newRow = rowIndexRBQ;
                                let newColumn = colIndexRBQ;
                                suggestedPathRBQ = [];
                                for (let j = 1; j <= arraySize; j++) {
                                    newRow += chessmoves[o.piece.slice(6)].x[i];
                                    newColumn += chessmoves[o.piece.slice(6)].y[i];

                                    let result = positionData.filter((p) => {
                                        return p.row === row[newRow] && p.column === column[newColumn] && p.type === o.type;
                                    }).length;

                                    if (row[newRow] === undefined || column[newColumn] === undefined || result) break;
                                    suggestedPathRBQ.push({ id: o.id, row: row[newRow], column: column[newColumn] });
                                }
                                // Get the suggetion capture of BQR that can capture the our piece
                                const capturePiece = positionData.filter((p) => {
                                    return suggestedPathRBQ.find((s) => s.row === p.row && p.column === s.column);
                                })

                                if (capturePiece.length) {
                                    // const suggestedPathOfOpponet = positionData.filter((pp) => capturePiece.find((cc) => cc.row == pp.row && cc.column === pp.column));
                                    const IsCurrentPiecesAvailable = capturePiece.find((sp) => sp.row === d.row && sp.column === d.column);
                                    const IsKingAvailable = capturePiece.find((sp) => sp.row === kingOnCheck.row && sp.column === kingOnCheck.column);
                                    const sizeOfSuggetedCapture = capturePiece.length;

                                    if (IsCurrentPiecesAvailable === undefined || IsKingAvailable === undefined || sizeOfSuggetedCapture != 2) {
                                        captureMoves = [captureResult];
                                        break;
                                    }
                                }
                            }
                        });
                    }
                }
                else if (chessPiece === "KNIGHT") {
                    const suggestedPathKnight = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                        suggestedPathKnight.push({ id: attacker.id, row: row[rowIndex + chessmoves[chessPiece].x[i]], column: column[colIndex + chessmoves[chessPiece].y[i]] });

                    const captureResult = suggestedPathKnight.find((s) => s.column === attacker.column && s.row === attacker.row);
                    if (captureResult) {
                        const opponets = positionData.filter((p) =>
                            p.type === attacker.type && (
                                p.piece.slice(6) === 'QUEEN' ||
                                p.piece.slice(6) === 'ROOK' ||
                                p.piece.slice(6) === 'BISHOP'));

                        opponets.forEach((o) => {
                            // Find the capture path
                            const rowIndexRBQ = row.findIndex((r) => r === o.row);
                            const colIndexRBQ = column.findIndex((c) => c === o.column);
                            let suggestedPathRBQ = [];

                            for (let i = 0; i < chessmoves[o.piece.slice(6)].x.length; i++) {
                                let newRow = rowIndexRBQ;
                                let newColumn = colIndexRBQ;
                                suggestedPathRBQ = [];
                                for (let j = 1; j <= arraySize; j++) {
                                    newRow += chessmoves[o.piece.slice(6)].x[i];
                                    newColumn += chessmoves[o.piece.slice(6)].y[i];

                                    if (row[newRow] === undefined || column[newColumn] === undefined) break;
                                    suggestedPathRBQ.push({ id: o.id, row: row[newRow], column: column[newColumn] });
                                }

                                const capturePiece = positionData.filter((p) => {
                                    return suggestedPathRBQ.find((s) => s.row === p.row && p.column === s.column);
                                })
                                if (capturePiece.length) {
                                    // const suggestedPathOfOpponet = positionData.filter((pp) => capturePiece.find((cc) => cc.row == pp.row && cc.column === pp.column));
                                    const IsCurrentPiecesAvailable = capturePiece.find((sp) => sp.row === d.row && sp.column === d.column);
                                    const IsKingAvailable = capturePiece.find((sp) => sp.row === kingOnCheck.row && sp.column === kingOnCheck.column);
                                    const sizeOfSuggetedCapture = capturePiece.length;

                                    if (IsCurrentPiecesAvailable === undefined || IsKingAvailable === undefined || sizeOfSuggetedCapture != 2) {
                                        captureMoves = [captureResult];
                                        break;
                                    }
                                }
                            }
                        });
                    };
                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    const suggestedCapture = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let j = 1; j <= arraySize; j++) {
                            newRow += chessmoves[chessPiece].x[i];
                            newColumn += chessmoves[chessPiece].y[i];

                            let result2 = positionData.filter((p) => {
                                if (p.row === row[newRow] && p.column === column[newColumn] && attacker.type !== p.type)
                                    suggestedCapture.push({ id: attacker.id, row: row[newRow], column: column[newColumn] });

                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                        }
                    }

                    const captureResult = suggestedCapture.find((s) => s.column === attacker.column && s.row === attacker.row);
                    // If this pieces can capture the attacker
                    if (captureResult) {
                        const opponets = positionData.filter((p) =>
                            p.type === attacker.type && (
                                p.piece.slice(6) === 'QUEEN' ||
                                p.piece.slice(6) === 'ROOK' ||
                                p.piece.slice(6) === 'BISHOP'));

                        opponets.forEach((o) => {
                            // Find the capture path
                            const rowIndexRBQ = row.findIndex((r) => r === o.row);
                            const colIndexRBQ = column.findIndex((c) => c === o.column);
                            let suggestedPathRBQ = [];

                            for (let i = 0; i < chessmoves[o.piece.slice(6)].x.length; i++) {
                                let newRow = rowIndexRBQ;
                                let newColumn = colIndexRBQ;
                                suggestedPathRBQ = [];
                                for (let j = 1; j <= arraySize; j++) {
                                    newRow += chessmoves[o.piece.slice(6)].x[i];
                                    newColumn += chessmoves[o.piece.slice(6)].y[i];

                                    let result = positionData.filter((p) => {
                                        return p.row === row[newRow] && p.column === column[newColumn] && p.type === o.type;
                                    }).length;

                                    if (row[newRow] === undefined || column[newColumn] === undefined || result) break;
                                    suggestedPathRBQ.push({ id: o.id, row: row[newRow], column: column[newColumn] });
                                }

                                const capturePiece = positionData.filter((p) => {
                                    return suggestedPathRBQ.find((s) => s.row === p.row && p.column === s.column && p.type === d.type);
                                })
                                const suggestedPathOfOpponet = positionData.filter((pp) => capturePiece.find((cc) => cc.row == pp.row && cc.column === pp.column));
                                const IsCurrentPiecesAvailable = suggestedPathOfOpponet.find((sp) => sp.row === d.row && sp.column === d.column);
                                const IsKingAvailable = suggestedPathOfOpponet.find((sp) => sp.row === kingOnCheck.row && sp.column === kingOnCheck.column);
                                const sizeOfSuggetedCapture = suggestedPathOfOpponet.length;

                                if (IsCurrentPiecesAvailable === undefined || IsKingAvailable === undefined || sizeOfSuggetedCapture != 2) {
                                    captureMoves = [captureResult];
                                    break;
                                }
                            }
                        });
                    };
                }
                else if (chessPiece === "KING") {
                    // Get the suggested path of king
                    const suggestedPathKing = [];
                    for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                        suggestedPathKing.push({
                            id: attacker.id,
                            row: row[rowIndex + chessmoves[chessPiece].x[i]],
                            column: column[colIndex + chessmoves[chessPiece].y[i]]
                        });

                    // Check the king able to capture the attacker or not
                    const kingResult = suggestedPathKing.find((s) => s.column === attacker.column && s.row === attacker.row);

                    // If king can capture the attacker 
                    if (kingResult) {
                        oppositeChessPieces.forEach((d) => {
                            const rowIndex = row.findIndex((r) => r === d.row);
                            const colIndex = column.findIndex((c) => c === d.column);
                            const selectionValue = d.type === "BLACK" ? 1 : -1;
                            const chessPiece = d.piece.slice(6);

                            if (chessPiece === "PAWN") {
                                const suggestedCapturePawn = [];
                                suggestedCapturePawn.push({ id: attacker.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex + 1] });
                                suggestedCapturePawn.push({ id: attacker.id, row: row[rowIndex + (1 * selectionValue)], column: column[colIndex - 1] });

                                const captureResult = suggestedCapturePawn.find((s) => s.column === attacker.column && s.row === attacker.row);
                                if (captureResult === undefined) {
                                    // capturePossible = true;
                                    captureMoves = [kingResult];
                                }
                            }
                            else if (chessPiece === "KNIGHT") {
                                const suggestedCaptureKnight = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                    suggestedCaptureKnight.push({
                                        id: attacker.id,
                                        row: row[rowIndex + chessmoves[chessPiece].x[i]],
                                        column: column[colIndex + chessmoves[chessPiece].y[i]]
                                    });
                                }

                                const captureResult = suggestedCaptureKnight.find((s) => s.column === attacker.column && s.row === attacker.row);
                                if (captureResult === undefined) {
                                    // capturePossible = true;
                                    captureMoves = [kingResult];
                                }
                            }
                            else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                                const suggestedCapture = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                    let newRow = rowIndex;
                                    let newColumn = colIndex;

                                    for (let j = 1; j <= arraySize; j++) {
                                        newRow += chessmoves[chessPiece].x[i];
                                        newColumn += chessmoves[chessPiece].y[i];

                                        let result2 = positionData.filter((p) => {
                                            if (p.row === row[newRow] && p.column === column[newColumn])
                                                suggestedCapture.push({ id: attacker.id, row: row[newRow], column: column[newColumn] });

                                            return p.row === row[newRow] && p.column === column[newColumn];
                                        }).length;

                                        if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                    }
                                }

                                const captureResult = suggestedCapture.find((s) => s.column === attacker.column && s.row === attacker.row);
                                if (captureResult === undefined) {
                                    // capturePossible = true;
                                    captureMoves = [kingResult];
                                }
                            }
                        });
                    };
                }
            });

            // ====================================
            // Checkmate Condition
            // ====================================

            captureMoves = captureMoves.filter((d) => d != undefined);
            protactorMoves = protactorMoves.filter((d) => d != undefined);
            suggestedPathForKing = suggestedPathForKing.filter((d) => d != undefined);

            if (!suggestedPathForKing.length && !protactorMoves.length && !captureMoves.length) {
                console.log("**** checkmate ****");

                // Notation on checkmate
                notationListBlack = notationListBlack.map((d, i) => {
                    if (i === (notationListBlack.length - 1)) {
                        if (d.slice(d.length - 1) === '+')
                            d = d.slice(0, d.length - 1) + '#';
                    }
                    return d;
                });
                notationListWhite = notationListWhite.map((d, i) => {
                    if (i === (notationListWhite.length - 1)) {
                        if (d.slice(d.length - 1) === '+')
                            d = d.slice(0, d.length - 1) + '#';
                    }
                    return d;
                });
                loadChessNotationView();

                // Show the popup
                modal.style.display = "block";
                modelButtonContainer.innerHTML = '';
                showcheckMateModel(attacker);
            } else {
                kingAttackBy = attacker;
                kingOnAttack = kingOnCheck;
            }
        }

        // ====================================
        // DRAW
        // ====================================
        function isDraw(turn) {
            const ownPieces = positionData.filter((d) => d.type === turn);
            const allSuggetedPath = [];
            const allCapturePath = [];

            ownPieces.forEach((d) => {
                const rowIndex = row.findIndex((r) => r === d.row);
                const colIndex = column.findIndex((c) => c === d.column);
                const selectionValue = d.type === "BLACK" ? 1 : -1;
                const chessPiece = d.piece.slice(6);
                let suggestedPathOp = [];
                let suggestedCaptureOp = [];

                // =================================
                // Get the all steps of move & capture
                // =================================
                if (chessPiece === "PAWN") {
                    // Suggested path
                    suggestedPathOp.push({ id: d.id, row: row[rowIndex + (1 * selectionValue)], column: d.column });
                    if (d.isFirst) suggestedPathOp.push({ id: d.id, row: row[rowIndex + (2 * selectionValue)], column: d.column });

                    // Checkout opsticals
                    suggestedPathOp = suggestedPathOp.filter((s) => {
                        return !positionData.filter((p) => p.row === s.row && p.column === s.column).length
                            && s.row !== undefined
                            && s.column !== undefined;
                    });

                    if (d.isFirst === true) {
                        let result = positionData.filter((p) => {
                            if (d.type === "BLACK") {
                                return p.row == parseInt(d.row) - 1 && p.column === d.column;
                            } else {
                                return p.row == parseInt(d.row) + 1 && p.column === d.column;
                            }
                        });
                        if (result.length) suggestedPathOp = [];
                    }

                    // Capture path
                    suggestedCaptureOp = positionData.filter((p) =>
                        p.row === row[rowIndex + (1 * selectionValue)]
                        && p.type != turn
                        && p.column != column[colIndex]
                        && (p.column === column[colIndex + 1]
                            || p.column === column[colIndex - 1]));

                    allSuggetedPath.push(...suggestedPathOp);
                    allCapturePath.push(...suggestedCaptureOp);
                }
                else if (chessPiece === "KING" || chessPiece === "KNIGHT") {
                    // Suggested path
                    const x = chessmoves[chessPiece].x;
                    const y = chessmoves[chessPiece].y;

                    for (let i = 0; i < x.length; i++)
                        suggestedPathOp.push({ id: d.id, row: row[rowIndex + x[i]], column: column[colIndex + y[i]] });

                    // Checkout opsticals
                    suggestedPathOp = suggestedPathOp.filter((s) => {
                        return !positionData.filter((p) => {
                            if (p.row === s.row
                                && p.column === s.column
                                && p.type != turn)
                                suggestedCaptureOp.push(p);

                            return p.row === s.row && p.column === s.column;
                        }).length
                            && s.row !== undefined
                            && s.column !== undefined;
                    });

                    if (chessPiece === "KING") {
                        const oppositeChessPieces = positionData.filter((p) => p.type != d.type);
                        let suggestedPathForKing = suggestedPathOp;

                        oppositeChessPieces.forEach((dd) => {
                            const rowIndexOp = row.findIndex((r) => r === dd.row);
                            const colIndexOp = column.findIndex((c) => c === dd.column);
                            const selectionValueOp = dd.type === "BLACK" ? 1 : -1;

                            const chessPiece = dd.piece.slice(6);
                            if (chessPiece === "PAWN") {
                                let suggestedPathPawn = [];
                                suggestedPathPawn.push({ id: dd.id, row: row[rowIndexOp + (1 * selectionValueOp)], column: column[colIndexOp + 1] });
                                suggestedPathPawn.push({ id: dd.id, row: row[rowIndexOp + (1 * selectionValueOp)], column: column[colIndexOp - 1] });

                                if (suggestedPathPawn.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPathPawn.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                            else if (chessPiece === "KNIGHT") {
                                let suggestedPathKnight = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++)
                                    suggestedPathKnight.push({ id: dd.id, row: row[rowIndexOp + chessmoves[chessPiece].x[i]], column: column[colIndexOp + chessmoves[chessPiece].y[i]] });

                                // Get the empty suggeted places and filterout the undefine values
                                suggestedPathKnight = suggestedPathKnight.filter((sk) => {
                                    return !(positionData.find((p) => p.row === sk.row && p.column === sk.column)) && sk.row != undefined && sk.column != undefined;
                                })

                                if (suggestedPathKnight.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPathKnight.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                            else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                                let suggestedPath = [];
                                for (let i = 0; i < chessmoves[chessPiece].x.length; i++) {
                                    let newRow = rowIndexOp;
                                    let newColumn = colIndexOp;

                                    for (let j = 1; j <= arraySize; j++) {
                                        newRow += chessmoves[chessPiece].x[i];
                                        newColumn += chessmoves[chessPiece].y[i];

                                        let result2 = positionData.filter((p) => {
                                            return p.row === row[newRow] && p.column === column[newColumn];
                                        }).length;

                                        if (row[newRow] === undefined || column[newColumn] === undefined || result2) break;
                                        suggestedPath.push({ id: dd.id, row: row[newRow], column: column[newColumn] });
                                    }
                                }
                                if (suggestedPath.length) {
                                    suggestedPathForKing = suggestedPathForKing.filter((sp) => {
                                        return !suggestedPath.find((sd) => sp.row === sd.row && sp.column === sd.column);
                                    });
                                }
                            }
                        });

                        suggestedPathOp = suggestedPathForKing;
                    }

                    allSuggetedPath.push(...suggestedPathOp);
                    allCapturePath.push(...suggestedCaptureOp);

                }
                else if (chessPiece === "ROOK" || chessPiece === "BISHOP" || chessPiece === "QUEEN") {
                    // Suggested path
                    const x = chessmoves[chessPiece].x;
                    const y = chessmoves[chessPiece].y;

                    for (let i = 0; i < x.length; i++) {
                        let newRow = rowIndex;
                        let newColumn = colIndex;

                        for (let i = 1; i <= arraySize; i++) {
                            newRow += x[i];
                            newColumn += y[i];

                            let result = positionData.filter((p) => {
                                if (p.row === row[newRow] && p.column === column[newColumn] && p.type != turn)
                                    suggestedCaptureOp.push(p);
                                return p.row === row[newRow] && p.column === column[newColumn];
                            }).length;

                            if (row[newRow] === undefined || column[newColumn] === undefined || result) break;
                            suggestedPathOp.push({ id: d.id, row: row[newRow], column: column[newColumn] });
                        }
                    }

                    allSuggetedPath.push(...suggestedPathOp);
                    allCapturePath.push(...suggestedCaptureOp);
                }
            })

            // ==========================================
            // Draw condition
            // ==========================================
            if (!allSuggetedPath.length && !allCapturePath.length) {
                console.log("****** Draw **********");
                // Show the popup
                modal.style.display = "block";
                modelButtonContainer.innerHTML = '';
                drawModel();
            }
        }
    });
}
