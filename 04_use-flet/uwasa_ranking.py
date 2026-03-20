import flet as ft
from z3 import *
import dataclasses


def main(page: ft.Page):
    page.title = "噂ランキング"
    page.bgcolor = ft.Colors.WHITE
    
    # ヘッダー部分
    url_launcher = ft.UrlLauncher()
    async def go_home(e: ft.Event[ft.Button]):
        #"_self" <- タブ遷移せずurlを開く
        await url_launcher.launch_url("https://npx4x4-tools.vercel.app/", web_only_window_name="_self",)
    
    home_button = ft.Button(content="ホームに戻る", on_click=go_home,)
    title = ft.Text("噂ランキング", theme_style=ft.TextThemeStyle.DISPLAY_LARGE)

    ## ランキング
    #対象人数を取得
    get_mem =   ft.CupertinoTextField(
                    placeholder_text="人数", 
                    input_filter=ft.InputFilter(allow=True, regex_string=r"^[0-9]*$", replacement_string="")
                )
    
    #並び替え条件(uwasa)を取得
    get_uwasa = ft.AutoComplete(
                    
                )
    

    # SMTソルバ処理
    def ranking():
        s = Solver()
        
        if result == sat:
        pass

    
    # 表示
    page.add(
        ft.Row(
            home_button,
            title,
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            control=[

            ],
        )
    )

ft.run(main)