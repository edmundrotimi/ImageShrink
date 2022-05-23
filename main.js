const {
    app,
    BrowserWindow,
    Menu,
    globalShortcut,
    ipcMain,
    shell
} = require('electron');
const os = require('os');
const path = require('path');
const slash = require('slash');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const log = require('electron-log');


let mainWindow, aboutWindow;

//electron process
process.env.NODE_ENV = 'production';
isDev = process.env.NODE_ENV !== 'production' ? true : false;
isMac = process.platform === 'darwin' ? true : false;

//create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Shrink',
        width: isDev ? 700 : 500,
        height: 600,
        icon: './assets/icons/Icon_256x256.png',
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    //load index html page
    mainWindow.loadFile('./app/index.html');

    //open dev tool by default
    // if(isDev){

    //     mainWindow.webContents.openDevTools()
    // }
}

//create about window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'Image Shrink',
        width: 400,
        height: 400,
        icon: './assets/icons/Icon_256x256.png',
        resizable: false,
    })

    //load index html page
    aboutWindow.loadFile('./app/about.html')
}

//custom menu
menu = [
    ...(isMac ? [{
        role: 'appMenu'
    }] : []),
    {
        label: 'File',
        submenu: [{
            label: 'Quit',
            accelerator: 'CmdOrCtrl+W',
            click: () => app.quit(),
        }]
    },
    {
        label: 'About',
        submenu: [{
            label: 'About',
            click: createAboutWindow,
        }]
    }
]

app.on('ready', () => {
    createMainWindow();

    // register shortcut
    globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I', () => mainWindow.toggleDevTools())

    //
    mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('ready', () => {
        mainWindow = null;
    })
})

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
})

//ipc communication
ipcMain.on('imageShrink', (e, options) => {
    options.path = path.join(os.homedir(), "imageshrink");
    console.log(options.uploadFilePath);
    shrinkImage(options.uploadFilePath, options.sliderValue, options.path);
})

async function shrinkImage(imagePath, quality, outputPath) {
    let qualityPercent = quality / 100;

    try {
        const files = await imagemin([slash(imagePath)], {
            destination: outputPath,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [qualityPercent, qualityPercent]
                }),
            ],
        });

        shell.openPath(outputPath);
    
        mainWindow.webContents.send('image:done');
    
    } catch (error) {
        log.warn(error);
    }  

}