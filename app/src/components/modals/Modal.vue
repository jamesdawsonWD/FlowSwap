<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useUi } from "@/store/ui";
import { IModal, ModalTypes } from "@/types";
import type { Ref } from "vue";
import AssetList from "./AssetList.vue";
const container: Ref<HTMLElement | null> = ref(null);
const html = document.documentElement;
const ui = useUi();
const modal: Ref<IModal> = ref(ui.getModal);
function checkClick(event: MouseEvent) {
  const modalRect = container.value.getBoundingClientRect();
  const mousePos = {
    x: event.x,
    y: event.y,
  };
  if (mousePos.x == 0 && mousePos.y == 0) return;
  if (
    mousePos.x <= modalRect.x ||
    mousePos.x >= modalRect.x + modalRect.width ||
    mousePos.y <= modalRect.y ||
    mousePos.y >= modalRect.y + modalRect.height
  )
    ui.closeModal();
}

watchEffect(() => {
  if (ui.getIsModalAwake) {
    html.classList.add("modal-open");
  } else {
    html.classList.remove("modal-open");
  }
});
</script>

<template>
  <transition name="modal" appear>
    <div class="modal-mask" @mousedown="checkClick">
      <div class="modal-wrapper">
        <div class="modal-container" ref="container">
          <AssetList
            v-if="modal.type == ModalTypes.AssetList"
            :callback="modal.callback"
            :info="modal.data"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@import "@/styles";

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: table;
  transition: opacity 0.3s ease;

  h2,
  h3 {
    color: var(--main-black);
  }
}

.blur {
  filter: blur(8px);
  -webkit-filter: blur(8px);
  height: inherit;
  width: inherit;
}
.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
}
.modal-container {
  height: 80vh;
  background-color: var(--first-shade);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  border-radius: 25px;
  font-family: Helvetica, Arial, sans-serif;
  position: relative;
  overflow: auto;
}

.modal-default-button {
  float: right;
}
.modal-enter {
  opacity: 0;
}
.modal-enter-active {
  opacity: 1;
}

.modal-leave-active {
  opacity: 0;
}

.modal-leave-active .modal-container {
  -webkit-transform: translateY(1000px);
  transform: translateY(1000px);
}
</style>
