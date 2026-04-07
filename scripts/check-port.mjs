#!/usr/bin/env node
/**
 * 포트 3030이 이미 사용 중인지 확인합니다.
 * 사용 중이면 에러를 출력하고 프로세스를 종료합니다.
 */

import { createServer } from "net";

const PORT = 3030;

const server = createServer();

server.once("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ 포트 ${PORT}이 이미 사용 중입니다.`);
    console.error(`   다른 프로세스가 포트 ${PORT}을 점유하고 있습니다.`);
    console.error(`   확인: netstat -ano | findstr :${PORT}\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  server.close();
});
