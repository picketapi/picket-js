import Picket from "../../picket"

//Warning: QR code theme is handled within the QR code component
export function setTheme(theme?: string): void {

    if (theme) {
        Picket.theme = theme;
    }

    if(Picket.theme == "dark" || Picket.theme == "auto" && window.matchMedia('(prefers-color-scheme: dark)').matches) { // Dark theme
        document.getElementsByClassName('main')[0].classList.add('dark')
    }else if(Picket.theme == "light" || Picket.theme == "auto" && !window.matchMedia('(prefers-color-scheme: dark)').matches) { // Light theme
        document.getElementsByClassName('main')[0].classList.remove('dark')
    }
    
    //Auto Theme
    if(Picket.theme == "auto") {
        setAutoDarkModeListener();
    }
  }

  export function getTheme(): string {
    return Picket.theme
  }

  //Handling auto dark mode
  export function setAutoDarkModeListener(){
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function () {
            if(Picket.theme == "auto") {
                setTheme();
            }
        });
  }