# git 브랜치 관련 명령어
## 브랜치 만들기('develop' 브랜치)
git branch develop
git checkout develop
git add .
git commit -m "first commit"
git push -u origin develop

## 브랜치 이동하기
git checkout develop
- 브랜치를 이동하면 그 브랜치의 파일 상태로 바뀌기 때문에 이동 전 커밋은 필수

## 현재 브랜치 확인
git branch

## push 하기(두 번째 부터)
git add .
git commit -m "commit message"
git push origin (브랜치이름)


## 완성 후 main에 올리기
git checkout main
git merge develop
git push origin main

# git branch
develop: main 올리기 전 다른 브랜치들을 합친 결과물
feat/redesign: 새로운 디자인 적용하기
feat/routing: 라우팅 적용
