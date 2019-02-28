<template>
  <div id="app">
    <div id="nav">
      <a href="/demo1" class="router-link-exact-active">Home</a> |
      <a href="/demo1/about">About</a>
    </div>
    <template>
      <div class="about">
        <h1>This is demo1 - home page</h1>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
