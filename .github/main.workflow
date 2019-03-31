workflow "gitbook deploy" {
  on = "push"
  resolves = ["gitbook-deploy"]
}

action "gitbook-deploy" {
  uses = "docker://khs1994/gitbook"
  args = "deploy"
  secrets = ["GITHUB_TOKEN"]
  env = {
    GIT_USERNAME = "khs1994"
    GIT_USEREMAIL = "khs1994@khs1994.com"
    GIT_BRANCH = "gh-pages"
  }
}

workflow "gitbook build" {
  on = "pull_request"
  resolves = ["gitbook-build"]
}

action "gitbook-build" {
  uses = "docker://khs1994/gitbook"
}
