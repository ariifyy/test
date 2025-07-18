from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QLineEdit,
    QTreeWidget, QTreeWidgetItem, QListWidget, QListWidgetItem,
    QSplitter, QInputDialog, QMessageBox, QMenu, QAction, QDialog,
    QCheckBox, QSizePolicy, QSpacerItem, QFrame
)
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtGui import QClipboard, QIcon
import sqlite3

from manager_addpassword import AddPasswordDialog
from manager_editpassword import EditPasswordDialog


class PasswordManagerWidget(QWidget):
    def __init__(self, user_id):
        super().__init__()
        self.user_id = user_id
        self.selected_folder = "All Passwords"
        self.init_ui()
        self.load_folders()
        self.load_passwords()

    def init_ui(self):
        main_layout = QVBoxLayout()
        top_bar = QHBoxLayout()

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search...")
        self.search_input.textChanged.connect(self.filter_passwords)

        self.add_btn = QPushButton("Add Password")
        self.add_btn.clicked.connect(self.add_password)

        top_bar.addWidget(QLabel("🔍"))
        top_bar.addWidget(self.search_input)
        top_bar.addStretch()
        top_bar.addWidget(self.add_btn)

        folder_controls = QHBoxLayout()
        self.add_folder_btn = QPushButton("Add")
        self.rename_folder_btn = QPushButton("Edit")
        self.delete_folder_btn = QPushButton("Delete")
        folder_controls.addWidget(self.add_folder_btn)
        folder_controls.addWidget(self.rename_folder_btn)
        folder_controls.addWidget(self.delete_folder_btn)

        self.add_folder_btn.clicked.connect(self.handle_add_folder)
        self.rename_folder_btn.clicked.connect(self.handle_rename_folder)
        self.delete_folder_btn.clicked.connect(self.handle_delete_folder)
        

        main_layout.addLayout(top_bar)
        main_layout.addLayout(folder_controls)

        splitter = QSplitter(Qt.Horizontal)
        splitter.setHandleWidth(0)
        splitter.setChildrenCollapsible(False)

        self.folder_tree = QTreeWidget()
        self.folder_tree.setHeaderHidden(True)
        self.folder_tree.itemClicked.connect(self.on_folder_selected)
        splitter.addWidget(self.folder_tree)

        self.password_list = QListWidget()
        self.password_list.setSpacing(4)
        self.password_list.itemClicked.connect(self.display_password_details)
        self.password_list.setSelectionMode(QListWidget.ExtendedSelection)
        splitter.addWidget(self.password_list)

        # Password Details Panel
        self.detail_widget = QFrame()
        self.detail_widget.setObjectName("DetailPanel")
        self.detail_widget.setStyleSheet("""
            QFrame#DetailPanel {
                border: 1px solid #888;
                border-radius: 6px;
                padding: 10px;
            }
        """)

        self.detail_layout = QVBoxLayout(self.detail_widget)
        self.detail_layout.setAlignment(Qt.AlignTop)

        self.detail_heading = QLabel("Password Details")
        self.detail_heading.setObjectName("DetailHeading")
        self.detail_heading.setStyleSheet("font-weight: bold; font-size: 16px; margin-bottom: 10px;")
        self.detail_layout.addWidget(self.detail_heading)

        self.detail_panel = QWidget()
        self.detail_panel_layout = QVBoxLayout(self.detail_panel)
        self.detail_panel_layout.setContentsMargins(0, 0, 0, 0)
        self.detail_panel_layout.setSpacing(6)
        self.detail_layout.addWidget(self.detail_panel)


        self.detail_layout.addItem(QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding))

        button_layout = QHBoxLayout()
        self.edit_btn = QPushButton("✏️ Edit")
        self.delete_btn = QPushButton("🗑 Delete")
        self.edit_btn.clicked.connect(self.edit_password)
        self.delete_btn.clicked.connect(self.delete_password)
        button_layout.addWidget(self.edit_btn)
        button_layout.addWidget(self.delete_btn)
        self.detail_layout.addLayout(button_layout)

        splitter.addWidget(self.detail_widget)

        splitter.setSizes([180, 220, 600])
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 0)
        splitter.setStretchFactor(2, 1)

        main_layout.addWidget(splitter)
        self.setLayout(main_layout)

    def load_folders(self):
        self.folder_tree.clear()
        root = QTreeWidgetItem(["All Passwords"])
        root.setData(0, Qt.UserRole, None) #Root folder has no folder id
        root.setExpanded(True)
        self.folder_tree.addTopLevelItem(root)

        conn = sqlite3.connect("LADOC.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, parent_id FROM users_folders WHERE user_id = ?", (self.user_id,))
        folders = cursor.fetchall()
        conn.close()

        id_to_item = {None:root}
        for folder_id, name, parent_id in folders:
            parent_item = id_to_item.get(parent_id, root)
            item = QTreeWidgetItem([name])
            item.setData(0, Qt.UserRole, folder_id)
            parent_item.addChild(item)
            id_to_item[folder_id] = item

    def handle_add_folder(self):
        selected = self.folder_tree.currentItem()
        if not selected:
            QMessageBox.warning(self, "No folder selected", "Select a parent folder.")
            return
        name, ok = QInputDialog.getText(self, "New Folder", "Folder name:")
        if ok and name:
            parent_id = selected.data(0, Qt.UserRole)
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users_folders (user_id, name, parent_id) VALUES (?, ?, ?)",
                           self.user_id, name, parent_id)
            conn.commit()
            conn.close()
            self.load_folders() 

    def handle_rename_folder(self):
        item = self.folder_tree.currentItem()
        folder_id = item.data(0, Qt.UserRole)
        if not folder_id:
            return
        new_name, ok = QInputDialog.getText(self, "Rename Folder", "New name", text=item.text(0))
        if ok and new_name:
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("UPDATE users_folders SET name = ? WHERE id = ?  and user_id = ?",
                           (new_name, folder_id, self.user_id))
            conn.commit()
            conn.close()
            self.load_folders()

    def handle_delete_folder(self):
        item = self.folder_tree.currentItem()
        folder_id = item.data(0, Qt.UserRole)
        if not folder_id:
            return
        reply = QMessageBox.question(self, "Delete Folder",
                                     "This will NOT delete passwords, only the folder. Continue?",
                                     QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            folder_path = self.build_folder_path(item)
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("UPDATE user_passwords SET folder_path = NULL WHERE user_id = ? AND folder_path = ?",
                           (self.user_id, folder_path))
            cursor.execute("DELETE FROM users_folders WHERE id = ? and user_id = ?", (folder_id, self.user_id))
            conn.commit()
            conn.close()
            self.load_folders()
            self.load_passwords()
        

    def load_passwords(self):
        self.password_list.clear()

        conn = sqlite3.connect("LADOC.db")
        cursor = conn.cursor()
        query = "SELECT id, title, username, folder_path FROM user_passwords WHERE user_id = ?"
        params = [self.user_id]
        if self.selected_folder != "All Passwords":
            query += " AND folder_path LIKE ?"
            params.append(f"{self.selected_folder}%")
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        conn.close()

        for entry_id, title, username, _ in sorted(rows, key=lambda x: x[1].lower()):
            item = QListWidgetItem()
            item.setData(Qt.UserRole, entry_id)

            entry_widget = QWidget()
            entry_layout = QVBoxLayout(entry_widget)
            entry_widget.setMinimumHeight(40)
            entry_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
            entry_layout.setContentsMargins(6, 2, 6, 2)

            title_label = QLabel(title)
            title_label.setObjectName("TitleLabel")
            title_label.setStyleSheet("font-weight: 600; font-size: 16px;")
            
            username_label = QLabel(username)
            username_label.setObjectName("UsernameLabel")
            username_label.setStyleSheet("font-size: 14px; color: grey;")

            entry_layout.addWidget(title_label)
            entry_layout.addWidget(username_label)

            item.setSizeHint(entry_widget.sizeHint()) 
            self.password_list.addItem(item)
            self.password_list.setItemWidget(item, entry_widget)

    def filter_passwords(self):
        keyword = self.search_input.text().lower()
        for i in range(self.password_list.count()):
            item = self.password_list.item(i)
            widget = self.password_list.itemWidget(item)

            title_label = widget.findChild(QLabel, "TitleLabel")
            username_label = widget.findChild(QLabel, "UsernameLabel")
            combined_text = f"{title_label.text()} {username_label.text()}".lower()

            item.setHidden(keyword not in combined_text)

    def on_folder_selected(self, item):
        if item.data(0, Qt.UserRole) is None:
            self.selected_folder = "All Passwords"
        else:
            self.selected_folder = self.build_folder_path(item)
        self.load_passwords()
        self.clear_detail_panel()


    def add_folder(self, parent_item):
        name, ok = QInputDialog.getText(self, "New Folder", "Folder name:")
        if ok and name:
            path = self.build_folder_path(parent_item)
            new_path = f"{path}/{name}" if path != "All Passwords" else name
            dummy = QTreeWidgetItem([name])
            parent_item.addChild(dummy)
            self.load_folders()

    def rename_folder(self, item):
        old_path = self.build_folder_path(item)
        new_name, ok = QInputDialog.getText(self, "Rename Folder", "New name:", text=item.text(0))
        if ok and new_name:
            new_path = "/".join(old_path.split("/")[:-1] + [new_name])
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_passwords
                SET folder_path = REPLACE(folder_path, ?, ?)
                WHERE user_id = ? AND folder_path LIKE ?
            """, (old_path, new_path, self.user_id, f"{old_path}%"))
            conn.commit()
            conn.close()
            self.load_folders()
            self.load_passwords()

    def delete_folder(self, item):
        path = self.build_folder_path(item)
        reply = QMessageBox.question(self, "Delete Folder",
            f"This will NOT delete passwords, only the folder structure for: {path}. Continue?",
            QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_passwords
                SET folder_path = NULL
                WHERE user_id = ? AND folder_path LIKE ?
            """, (self.user_id, f"{path}%"))
            conn.commit()
            conn.close()
            self.load_folders()
            self.load_passwords()

    def build_folder_path(self, item):
        names = []
        while item and item.data(0, Qt.UserRole) is not None:
            names.insert(0, item.text(0))
            item = item.parent()
        return "/".join(names)

    def get_selected_entry_id(self):
        selected = self.password_list.selectedItems()
        if not selected:
            return None
        return selected[0].data(Qt.UserRole)

    def edit_password(self):
        entry_id = self.get_selected_entry_id()
        if entry_id is None:
            return

        conn = sqlite3.connect("LADOC.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT title, username, password, site, notes, folder_path, password_expiry
            FROM user_passwords
            WHERE id = ?
        """, (entry_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            data = {
                "title": row[0],
                "username": row[1],
                "password": row[2],
                "site": row[3],
                "notes": row[4],
                "folder_path": row[5],
                "password_expiry": row[6]
            }

            dialog = EditPasswordDialog(data, self)
            if dialog.exec_() == QDialog.Accepted:
                updated = dialog.get_data()
                conn = sqlite3.connect("LADOC.db")
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE user_passwords
                    SET title = ?, username = ?, password = ?, site = ?, notes = ?, folder_path = ?, password_expiry = ?
                    WHERE id = ?
                """, (
                    updated["title"], updated["username"], updated["password"],
                    updated["site"], updated["notes"], updated["folder_path"],
                    updated["password_expiry"], entry_id
                ))
                conn.commit()
                conn.close()
                self.load_folders()
                self.load_passwords()

    def delete_password(self):
        entry_id = self.get_selected_entry_id()
        if entry_id is None:
            return

        reply = QMessageBox.question(self, "Delete Password",
                                     "Are you sure you want to permanently delete this password?",
                                     QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_passwords WHERE id = ?", (entry_id,))
            conn.commit()
            conn.close()
            self.load_passwords()
            self.detail_panel.setText("")

    def display_password_details(self, item):
        entry_id = item.data(Qt.UserRole)
        conn = sqlite3.connect("LADOC.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT title, username, password, site, password_expiry, notes
            FROM user_passwords
            WHERE id = ?
        """, (entry_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            self.clear_detail_panel()
            return

        title, username, password, site, expiry, notes = row
        expiry = expiry or "None"
        self.current_password_plain = password
        self.current_password_visible = False

        self.clear_detail_panel()

        def add_field(label_text, value_text, multiline=False, is_password=False):
            field_container = QWidget()
            field_layout = QVBoxLayout(field_container)
            field_layout.setContentsMargins(0, 0, 0, 12)
            field_layout.setSpacing(2)

            label = QLabel(label_text)
            label.setStyleSheet("font-size: 14px; color: grey;")

            if is_password:
                # HBox for password + icon
                pw_row = QHBoxLayout()
                pw_row.setContentsMargins(0, 0, 0, 0)
                pw_row.setSpacing(6)

                self.password_value_label = QLabel("●" * len(value_text))
                self.password_value_label.setStyleSheet("font-weight: bold; font-size: 16px;")
                self.password_value_label.setTextInteractionFlags(Qt.TextSelectableByMouse)

                self.eye_btn = QPushButton("Show")  # text instead of icon
                self.eye_btn.setFlat(True)
                self.eye_btn.setCursor(Qt.PointingHandCursor)
                self.eye_btn.setStyleSheet("""
                    border: none;
                    font-weight: bold;
                    font-size: 14px;
                """)
                self.eye_btn.clicked.connect(self.toggle_password_visibility)

                pw_row.addWidget(self.password_value_label)
                pw_row.addWidget(self.eye_btn)

                field_layout.addWidget(label)
                field_layout.addLayout(pw_row)

            else:
                value = QLabel(value_text)
                value.setStyleSheet("font-weight: bold; font-size: 16px;")
                value.setTextInteractionFlags(Qt.TextSelectableByMouse)
                if multiline:
                    value.setWordWrap(True)
                field_layout.addWidget(label)
                field_layout.addWidget(value)

            self.detail_panel_layout.addWidget(field_container)

        add_field("Title", title)
        add_field("Username", username)
        add_field("Password", password, is_password=True)
        add_field("Site", site)
        add_field("Expiry", expiry)
        add_field("Notes", notes or "", multiline=True)


    def clear_detail_panel(self):
        while self.detail_panel_layout.count():
            child = self.detail_panel_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()

    def toggle_password_visibility(self):
        self.current_password_visible = not self.current_password_visible
        if self.current_password_visible:
            self.password_value_label.setText(self.current_password_plain)
            self.eye_btn.setText("Hide")
        else:
            self.password_value_label.setText("●" * len(self.current_password_plain))
            self.eye_btn.setText("Show")


    def add_password(self):
        dialog = AddPasswordDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            data = dialog.get_data()
            conn = sqlite3.connect("LADOC.db")
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_passwords (user_id, title, username, password, site, notes, folder_path, password_expiry)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                self.user_id,
                data["title"],
                data["username"],
                data["password"],
                data["site"],
                data["notes"],
                data["folder_path"],
                data["password_expiry"]
            ))
            conn.commit()
            conn.close()

            self.load_folders()
            self.load_passwords()
