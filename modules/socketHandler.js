const { Server } = require("socket.io");
const fs = require("fs");
const { clearInterval } = require("timers");
let file_csv = fs.readFileSync("Assignment3.csv", "utf-8");
let stationList = file_csv.split("\r\n");
function socketHandler(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });


  let user = [];
  let personCount = 0;
  let isStop = false;
  let counter = 100;
  let count = 1;
  let idList = []
  let list = stationList;
  let list2 = [];
  let agree = [];


  io.on("connection", (socket) => {
    // 접속 시 서버에서 실행되는 코드
    const req = socket.request;
    const socket_id = socket.id;
    const client_ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log("connection!");
    console.log("socket ID : ", socket_id);
    console.log("client IP : ", client_ip);


    socket.on("disconnect", () => {
      // 사전 정의 된 callback (disconnect, error)
      console.log("Person Count : " + personCount);
      if (personCount == 3) {
        console.log("인원3입니다");
        io.emit("wait2", `현재상태 : 다른 게임 참가자를 기다리고 있습니다.`);
      }
      --personCount;
      if (personCount < 3) {
        console.log("게임취소");
        io.emit("cancel");
      }
      user.pop();
      console.log("인원수 : ", personCount);
      if (personCount <= -1) {
        personCount = 0;
      }
    });

    //connect시 서버에서 시작되는 함수
    socket.on("firstEvent", () => {
      socket.emit("getID", socket.id);
    });

    socket.on("answerPush", (data) => {
      if (data.length > 0) {
        for (let i = 0; i < list2.length; i++) {
          if (list2[i] == data) {
            list2 = [];
            for (let j = 0; j < 3; j++) {
              user[j].point++;
            }
            if (count == 1) {
              user[0].point--;
            }
            else if (count == 2) {
              user[1].point--;
            } else {
              user[2].point--;
            }
            io.emit("answerPlus", data);
            io.emit("plusOne", user);
            io.emit("gameFinish", "이미 나온 답입니다!");
            io.emit("gameReplay");
            return;
          }
        }
        for (let i = 0; i < list.length; i++) {
          if (list[i] == data) {
            list2.push(data);
            count++;
            if (count > 3) {
              count = 1;
            }
            io.emit("answerPlus", data);
            socket.to(idList[count]).emit("myTurnBtn");
            socket.to(idList[count]).emit("TimerStart", `내 턴!`);
            return;
          }
        }
        for (let j = 0; j < 3; j++) {
          user[j].point++;
        }
        if (count == 1) {
          user[0].point--;
        }
        else if (count == 2) {
          user[1].point--;
        } else {
          user[2].point--;
        }
        io.emit("plusOne", user);
        io.emit("gameFinish", "없는 역을 입력하셨습니다.");
        io.emit("gameReplay");
        return;
      }
      for (let j = 0; j < 3; j++) {
        user[j].point++;
      }
      if (count == 1) {
        user[0].point--;
      }
      else if (count == 2) {
        user[1].point--;
      } else {
        user[2].point--;
      }
      io.emit("plusOne", user);
      io.emit("gameFinish", "시간초과!");
    });

    socket.on("ready1", () => {
      io.emit("wait1", `다른 게임 참가자를 기다리고 있습니다.`);
    });

    socket.on("Agree", () => {
      agree.push(1);
      if (agree.length == 3) {
        agree = [];
        io.emit("start2", user);
        socket.emit("start3");
        list2 = [];
        let randomNum2 = Math.floor(Math.random() * 3);
        socket.to(idList[randomNum2]).emit("myTurnBtn");
        socket.to(idList[randomNum2]).emit("TimerStart", `내 턴!`);
      } else {
        socket.emit("gameReplayReady", "상대방의 선택을 기다리는 중");
      }
    })
    socket.on("notAgree", () => {
      agree = [];
    })

    socket.on("countdownBtn", () => {
      isStop = false;
      counter = 100;
      socket.on("countdownstopbtn", () => {
        clearInterval(cdb)
      });
      const cdb = setInterval(() => {
        if (!isStop) {

          if (counter == 0) {
            io.emit("gameFinish", "게임종료.");
            clearInterval(cdb);
          } else {
            counter--;
            io.emit("countdown", counter);
          }
        } else {
          clearInterval(cdb);
        }
      }, 1000);

    });

    socket.on("ready", (data, data2) => {
      user.push({ nickname: data, point: 0 });
      console.log(user);
      personCount++;
      console.log("게임 참가자 수 :" + personCount);
      /*user[data].nickname = data2;
      usersave[personCount] = data;*/
      idList[personCount] = data2;
      console.log(idList);
      //usersave배열에 유저 아이디 저장
      if (personCount == 4) {
        socket.emit("refuse", "먼저 접속한 클라이언트들간 게임이 진행중입니다.");
      } else if (personCount == 3) {
        io.emit("start", user);
        let randomNum2 = Math.floor(Math.random() * 3);
        console.log(randomNum2);
        socket.to(idList[randomNum2]).emit("myTurnBtn");
        socket.to(idList[randomNum2]).emit("TimerStart", `내 턴!`);
      } else {
        socket.emit("wait", `다른 게임 참가자를 기다리고 있습니다.`);
      }
    });

  });
}
module.exports = socketHandler;
