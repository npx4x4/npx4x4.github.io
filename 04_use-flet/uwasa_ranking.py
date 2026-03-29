import flet as ft
from z3 import *

# ここに変数置いてはいけない

def main(page: ft.Page):
    page.title = "噂ランキング"
    page.theme_mode = ft.ThemeMode.LIGHT
    # page.theme  =   ft.Theme(

    #                 )
    
    
    ## 変数ゾーン
    # フラグ
    is_target_mem: bool = False
    
    # データ
    ranking_size: int = 40
    members = []
    uwasa_box = []
    
    
    ## ヘッダー部分
    url_launcher = ft.UrlLauncher()
    async def go_home(e: ft.Event[ft.Button]):
        #"_self" <- タブ遷移せずurlを開く
        await url_launcher.launch_url("https://npx4x4-tools.vercel.app/", web_only_window_name="_self",)
    
    home_button = ft.Button(content="ホームに戻る", on_click=go_home,)
    title = ft.Text("噂ランキング", theme_style=ft.TextThemeStyle.DISPLAY_LARGE)


    ## 警告用スナックバー表示
    def open_snackbar(message: str):
        page.show_dialog(
            ft.SnackBar(
                ft.Text(message, size=16),
                bgcolor="#1c8c42",
                action=ft.SnackBarAction(
                    label="了解",
                    text_color="#1c8c42",
                    bgcolor=ft.Colors.WHITE
                )
            )
        )
    
    
    ## ランキング
    # 参加人数入力フィールド
    num_members =   ft.TextField(
                        width=100,
                        label="参加人数",
                        value=40,
                        input_filter=ft.InputFilter(
                            allow=True,
                            regex_string=r"^[0-9]*$",
                            replacement_string=""
                        )
                    )
    # 参加人数更新
    def change_ranking_size():
        nonlocal ranking_size
        old_ranking_size = ranking_size
        new_ranking_size = int(num_members.value)
        if new_ranking_size==old_ranking_size:
            open_snackbar("参加人数に変化がありませんでした.")
            return
        if new_ranking_size<2:
            open_snackbar("参加人数は2人以上にしてください.")
            num_members.value = old_ranking_size
            return
        ranking_size = new_ranking_size
    # 設定が変更された場合のデータリセット
    def reset_data():
        nonlocal members, uwasa_box
        members = []
        uwasa_box = [] # 噂の辞書型リスト
    
    
    # 並び替え条件(uwasa)を取得
    # 誰がorは(uwasaの主語)
    who_input = ft.AutoComplete(
                    width=160,
                    on_change=None,
                    on_select=None,
                    suggestions=[
                        ft.AutoCompleteSuggestion(key=member, value=member)
                        for member in members
                    ],
                )
    
    # 比較対象(人)
    target_mem_input =  ft.Dropdown(
                            width=160,
                            editable=True,
                            label="比較対象",
                            options=[
                                ft.dropdown.Option(key=member, text=member)
                                for member in members
                            ]
                        )
    
    # 比較対象(順位)        
    target_num_input =  ft.TextField(
                            width=160,
                            label="順位",
                            input_filter=ft.InputFilter(
                                allow=True,
                                regex_string=r"^[0-9]*$",
                                replacement_string="",
                            ),
                        )
    
    # 比較対象タイプの切り替え
    def update_target_type(e):
        nonlocal is_target_mem
        
        radio_value = target_type_radio.value
        if radio_value=="mem":
            target_mem_input.visible = True
            target_num_input.visible = False
            is_target_mem = True
        else:
            target_mem_input.visible = False
            target_num_input.visible = True
            is_target_mem = False
        
        # print(str(is_target_mem))
        page.update()
    
    # 比較しての評価
    op_input =  ft.Dropdown(
                    width=160,
                    label="比較",
                    value=None,
                    options=[
                        # 順位がより高い->順位の値は小さくなる
                        ft.DropdownOption(key="<", text="より高い(<)"),
                        ft.DropdownOption(key="==", text="と同じ(=)"),
                        ft.DropdownOption(key=">", text="より低い(>)"),
                    ],
                )
    
    # 入力されたuwasaのフィードバックテキスト
    def change_uwasa_feedback(text: str, is_warning: bool):
        if is_warning:
            uwasa_feedback.color = ft.Colors.RED
        else:
            uwasa_feedback.color = ft.Colors.BLACK
        uwasa_feedback.value = text
        uwasa_feedback.update()
    
    # uwasaの各入力に不正がないかチェック
    def check_uwasa_input(who, target, op) -> bool:
        if who==None or target==None or op==None:
            change_uwasa_feedback("中身のない噂だな...。 無視しよ。", is_warning=True)
            return False
        if is_target_mem:
            if who==target:
                if op=="==":
                    change_uwasa_feedback("そりゃそうだろう...。 無視しよ。", is_warning=True)
                else:
                    change_uwasa_feedback("明らかにウソだな...。 無視しよ。", is_warning=True)
                return False
        else:
            target = int(target)
            if  (target>ranking_size and (op==">" or op=="==")) or\
                (target==0 and (op=="<" or op=="==")) or\
                (target==1 and op=="<"):
                    change_uwasa_feedback("明らかにウソだな...。 無視しよ。", is_warning=True)
                    return False
            elif    (target>ranking_size and op=="<") or\
                    (target==0 and op==">"):
                        change_uwasa_feedback("そりゃそうだろう...。 無視しよ。", is_warning=True)
                        return False
        # membersの中にwhoが存在するか確認 "in" を使う
        if who not in members:
            if len(members)+1>ranking_size:
                change_uwasa_feedback("登場人物が多すぎないか...。 無視しよ。", is_warning=True)
                return False
        return True
    
    # uwasaに不正がないかチェック
    # 矛盾判定はソルバにまかせたため重複確認のみ確認
    def check_uwasa(new_uwasa: dict[str, any]) -> bool:
        if uwasa_box: 
            for uwasa in uwasa_box:
                if new_uwasa==uwasa:
                    change_uwasa_feedback("もう聞いたことある噂だな...。 無視しよ。", is_warning=True)
                    return False
                if uwasa["is_target_mem"]:
                    if  new_uwasa["who"]==uwasa["target"] and\
                        new_uwasa["target"]==uwasa["who"] and\
                        new_uwasa["op"]==uwasa["op"]:
                            change_uwasa_feedback("同じ内容の噂を知ってるな...。 無視しよ。", is_warning=True)
                            return False
        return True
    
    # メンバー追加
    # 入力欄の表示更新もかねる
    def add_member(who: str):
        nonlocal members
        members.append(who)
        who_input.suggestions = [
            ft.AutoCompleteSuggestion(key=member, value=member)
            for member in members
        ]
        who_input.update()
        target_mem_input.options = [
            ft.dropdown.Option(member)
            for member in members
        ]
        target_mem_input.update()
    
    # uwasaの各入力を取得しSMTソルバ用に処理を行う
    def add_uwasa(e: ft.Event[ft.Button]):
        nonlocal members, uwasa_box
        change_uwasa_feedback("", is_warning=False)
        #噂の各種要素を取得
        who = who_input.value
        if is_target_mem:
            target = target_mem_input.value
        else:
            target = target_num_input.value
        op = op_input.value
        
        if check_uwasa_input(who, target, op):
            if who not in members:
                add_member(who)
                print(members)
            new_uwasa = {"who": who, "target": target, "op": op, "is_target_mem": is_target_mem}
            if check_uwasa(new_uwasa):
                # 矛盾があった場合はランキングが成立しないため判定に用いる
                if ranking(new_uwasa):
                    uwasa_box.append(new_uwasa)


    # SMTソルバ処理
    # 解が求まらない->uwasaが矛盾と判断(False)
    def ranking(new_uwasa: dict[str, any]) -> bool:
        # members内の名前をz3で使いやすくまとめておく
        z3_members = {}
        
        s = Solver()
        for member in members:
            z3_members[member] = Int(member)
            s.add(z3_members[member] > 0)
            s.add(z3_members[member] < ranking_size)
        
        def add_to_s(uwasa: dict[str: any]):
            who, target, op = uwasa["who"], uwasa["target"], uwasa["op"]
            if uwasa["is_target_mem"]:
                match op:
                    case "<":
                        s.add(z3_members[who] < z3_members[target])
                    case "==":
                        s.add(z3_members[who] == z3_members[target])
                    case ">":
                        s.add(z3_members[who] > z3_members[target])
            else:
                match op:
                    case "<":
                        s.add(z3_members[who] < int(target))
                    case "==":
                        s.add(z3_members[who] == int(target))
                    case ">":
                        s.add(z3_members[who] > int(target))
        
        for uwasa in uwasa_box:
            add_to_s(uwasa)
        add_to_s(new_uwasa)
        s.add(Distinct(list(z3_members.values())))
            
        result = s.check()
        if result == sat:
            return True
        else:
            change_uwasa_feedback("他の噂と矛盾があるな...。 無視しよ。", is_warning=True)
            return False
    
    # ランキング用テーブル
        ranking_view =  ft.DataTable(
                            width=800,
                            border=ft.border.all(2, "#1c8c42"),
                            columns=[
                                ft.DataColumn(
                                    ft.Text("名前"),
                                ),
                                ft.DataColumn(
                                    ft.Text("状態"),
                                ),
                            ],
                            rows=[
                                ft.DataRow(
                                    [ft.DataCell(ft.Text)]
                                )
                            ]
                        )
                            
    
    # 表示
    page.add(
        ft.Container(
            content=home_button,
            padding=ft.padding.only(left=5, top=15,),
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            controls=[
                title,
            ]
        ),
        ft.Container(
            content=ft.Row(
                        alignment=ft.MainAxisAlignment.CENTER,
                        controls=[
                            num_members,
                            ft.TextButton(
                                content="更新", 
                                icon=ft.Icons.LOOP, 
                                tooltip="設定を変更すると入力した情報がリセットされます.",
                                on_click=change_ranking_size,
                            ),
                        ]
                    ),
            padding=ft.padding.only(top=20, bottom=30),
        ),
        ft.Column(
            alignment=ft.MainAxisAlignment.START,
            controls=[
                ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        who_input,
                        ft.Text("は", size=16),
                        target_mem_input,
                        target_num_input,
                        op_input,
                    ]
                ),
                ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        target_type_radio := ft.RadioGroup(
                            content=ft.Row(
                                controls=[
                                    ft.Radio(value="mem", label="人"),
                                    ft.Radio(value="num", label="順位"),
                                ],
                            ),
                            on_change=update_target_type,
                        ), 
                        ft.Button(width=160, content="噂をながす", on_click=add_uwasa),
                    ]
                )
            ]
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            controls=[
                uwasa_feedback := ft.Text("", size=16)
            ]
        )
    )
    
    # 初期設定
    target_mem_input.visible = False
    target_num_input.visible = True
    target_type_radio.value = "num"

ft.run(main)